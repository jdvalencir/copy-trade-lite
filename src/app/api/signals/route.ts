import { MARKET, read } from "@/lib/decibel";
import { addSignal, listSignals, validateSignalInput } from "@/lib/signals";
import { NextResponse } from "next/server";
import "server-only";


export async function GET() {
  try {
    const signals = await listSignals();
    return NextResponse.json({ signals });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error listing signals." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // The client does NOT send entry; we set it ourselves. Validate the rest.
    const prices: any = await read.marketPrices.getByName({ marketName: MARKET });
    const priceData = Array.isArray(prices) ? prices[0] : prices;
    const entry = Number(priceData?.mid_px ?? priceData?.mark_px);
    if (!Number.isFinite(entry) || entry <= 0) {
      return NextResponse.json({ error: "Could not read the live price." }, { status: 502 });
    }

    // Inject entry before validating (so it passes the numeric check)
    const candidate = { ...body, entry, market: MARKET };
    const err = validateSignalInput(candidate);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    // Copy-trade specific validation: TP above and SL below the entry
    // (for a long; reversed for a short)
    const signal = await addSignal({
      author: typeof body.author === "string" && body.author.trim() ? body.author.trim() : "anon",
      market: MARKET,
      side: candidate.side,
      entry,
      tpPercent: candidate.tpPercent,
      slPercent: candidate.slPercent,
      holdHours: candidate.holdHours,
      size: candidate.size,
    });

    return NextResponse.json({ ok: true, signal });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message ?? "Error creating signal." }, { status: 400 });
  }
}