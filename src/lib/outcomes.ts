import "server-only";
import { MARKET, read } from "./decibel";
import { Signal } from "./signals";
import type { Outcome, SignalWithOutcome } from "./signal-types";

type Candle = { t: number; h: number; l: number };

// Candle timestamps may come back in seconds or milliseconds; normalize to ms.
const toMs = (t: number) => (t < 1e12 ? t * 1000 : t);

function levels(s: Signal) {
  const dir = s.side === "buy" ? 1 : -1; // long: TP above / SL below; short: reversed
  const tp = s.entry * (1 + (dir * s.tpPercent) / 100);
  const sl = s.entry * (1 - (dir * s.slPercent) / 100);
  return { dir, tp, sl };
}

// Fetch candles for the whole window once. Auto-detects whether the API wants
// seconds or milliseconds (tries ms first, retries in seconds if empty).
async function fetchCandles(startMs: number, endMs: number): Promise<Candle[]> {
  const rangeHours = (endMs - startMs) / 3_600_000;
  const interval = rangeHours <= 24 ? "1m" : rangeHours <= 96 ? "5m" : "15m";
  const call = (s: number, e: number) =>
    read.candlesticks.getByName({ marketName: MARKET, interval, startTime: s, endTime: e }) as Promise<any>;

  let raw: any = await call(startMs, endMs);
  if (!Array.isArray(raw) || raw.length === 0) {
    raw = await call(Math.floor(startMs / 1000), Math.floor(endMs / 1000));
  }
  return (Array.isArray(raw) ? raw : [])
    .map((c: any) => ({ t: toMs(Number(c.t)), h: Number(c.h), l: Number(c.l) }))
    .filter((c: Candle) => Number.isFinite(c.t) && Number.isFinite(c.h) && Number.isFinite(c.l))
    .sort((a: Candle, b: Candle) => a.t - b.t);
}

function outcomeFor(s: Signal, candles: Candle[], now: number): Outcome {
  const { dir, tp, sl } = levels(s);
  const expiry = s.createdAt + s.holdHours * 3_600_000;
  const end = Math.min(now, expiry);

  // Walk chronologically; the first threshold crossed wins. If one candle
  // touched both, treat SL as first (conservative for a track record).
  for (const c of candles) {
    if (c.t < s.createdAt || c.t > end) continue;
    const hitSl = dir === 1 ? c.l <= sl : c.h >= sl;
    const hitTp = dir === 1 ? c.h >= tp : c.l <= tp;
    if (hitSl) return "sl";
    if (hitTp) return "tp";
  }
  return now >= expiry ? "expired" : "active";
}

// Enriches signals with a real outcome using one (or two) candle fetches for
// the whole set. If candles can't be read, falls back to a time-based status
// (active/expired) — never fabricates a TP/SL hit.
export async function enrichWithOutcomes(signals: Signal[]): Promise<SignalWithOutcome[]> {
  if (signals.length === 0) return [];
  const now = Date.now();
  const earliest = Math.min(...signals.map((s) => s.createdAt));

  let candles: Candle[] = [];
  try {
    candles = await fetchCandles(earliest, now);
  } catch {
    candles = [];
  }

  return signals.map((s) => ({ ...s, outcome: outcomeFor(s, candles, now) }));
}
