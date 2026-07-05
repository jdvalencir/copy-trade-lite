"use client";
import { useEffect, useState } from "react";

// Status-coded price meter for one signal: loss zone (SL->entry) red,
// profit zone (entry->TP) green, entry as the neutral divider, and a live
// price needle. Colors follow the role (profit/loss), not the side, so a
// short reads the same way a long does — the axis is price, high to the right.
export function SignalChart({
  entry,
  tpPrice,
  slPrice,
}: {
  entry: number;
  tpPrice: number;
  slPrice: number;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/price");
        const json = await res.json();
        if (active && res.ok && Number.isFinite(json.price)) setNow(json.price);
      } catch {
        /* leave the needle hidden if the price can't be read */
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const lo = Math.min(slPrice, tpPrice);
  const hi = Math.max(slPrice, tpPrice);
  const pad = (hi - lo) * 0.12 || 1;
  const domainMin = lo - pad;
  const domainMax = hi + pad;
  const pct = (p: number) =>
    Math.max(0, Math.min(100, ((p - domainMin) / (domainMax - domainMin)) * 100));

  const xEntry = pct(entry);
  const xTp = pct(tpPrice);
  const xSl = pct(slPrice);
  const xNow = now != null ? pct(now) : null;

  const lossL = Math.min(xSl, xEntry);
  const lossR = Math.max(xSl, xEntry);
  const profL = Math.min(xEntry, xTp);
  const profR = Math.max(xEntry, xTp);

  const trackY = 26;
  const labelY = 48;
  const H = 56;
  const anchorFor = (x: number) => (x < 8 ? "start" : x > 92 ? "end" : "middle");

  return (
    <div className="mt-1">
      <svg width="100%" height={H} className="overflow-visible" role="img"
        aria-label={`Price meter. SL ${slPrice.toFixed(0)}, entry ${entry.toFixed(0)}, TP ${tpPrice.toFixed(0)}${now != null ? `, now ${now.toFixed(0)}` : ""}.`}>
        {/* base track */}
        <rect x="0%" y={trackY} width="100%" height={6} rx={3} className="fill-gray-200 dark:fill-neutral-700" />
        {/* loss zone SL -> entry */}
        <rect x={`${lossL}%`} y={trackY} width={`${lossR - lossL}%`} height={6} rx={3} fill="#dc2626" opacity={0.85} />
        {/* profit zone entry -> TP */}
        <rect x={`${profL}%`} y={trackY} width={`${profR - profL}%`} height={6} rx={3} fill="#16a34a" opacity={0.85} />

        {/* entry divider */}
        <line x1={`${xEntry}%`} x2={`${xEntry}%`} y1={trackY - 8} y2={trackY + 14} stroke="#6b7280" strokeWidth={2} strokeLinecap="round" />

        {/* live price needle */}
        {xNow != null && (
          <g>
            <line x1={`${xNow}%`} x2={`${xNow}%`} y1={trackY - 14} y2={trackY + 6} stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
            <circle cx={`${xNow}%`} cy={trackY - 14} r={4.5} fill="#2563eb" />
          </g>
        )}

        {/* role ticks */}
        <circle cx={`${xSl}%`} cy={trackY + 3} r={4} fill="#dc2626" className="stroke-white dark:stroke-neutral-900" strokeWidth={2} />
        <circle cx={`${xTp}%`} cy={trackY + 3} r={4} fill="#16a34a" className="stroke-white dark:stroke-neutral-900" strokeWidth={2} />

        {/* direct labels anchored to each tick — works for long and short */}
        <text x={`${xSl}%`} y={labelY} textAnchor={anchorFor(xSl)} fontSize={11} fill="#6b7280">SL {slPrice.toFixed(0)}</text>
        <text x={`${xEntry}%`} y={labelY} textAnchor={anchorFor(xEntry)} fontSize={11} fill="#6b7280">Entry {entry.toFixed(0)}</text>
        <text x={`${xTp}%`} y={labelY} textAnchor={anchorFor(xTp)} fontSize={11} fill="#6b7280">TP {tpPrice.toFixed(0)}</text>
      </svg>
      {now != null && (
        <p className="text-xs text-blue-600 dark:text-blue-400">Now {now.toFixed(0)}</p>
      )}
    </div>
  );
}
