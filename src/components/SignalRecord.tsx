"use client";
import { Signal } from "@/lib/signals";
import { useState } from "react";

type Status =
  | { kind: "idle" | "loading" }
  | { kind: "ok"; hash: string }
  | { kind: "error"; msg: string };

export function SignalRecord({ signal }: { signal: Signal }) {
  const { author, market, side, entry, tpPercent, slPercent, holdHours, size, createdAt } = signal;
  const created = new Date(createdAt).toLocaleString();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Target prices derived from the frozen entry (long: TP above, SL below)
  const dir = side === "buy" ? 1 : -1;
  const tpPrice = entry * (1 + (dir * tpPercent) / 100);
  const slPrice = entry * (1 - (dir * slPercent) / 100);

  async function copy() {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBuy: side === "buy", size }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({ kind: "error", msg: json.error ?? "Could not copy the trade." });
      } else {
        setStatus({ kind: "ok", hash: json.hash ?? "" });
      }
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  }

  const loading = status.kind === "loading";

  return (
    <div className="border rounded-2xl p-4 mb-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-bold">{market}</span>
        <span className={`px-2 py-1 rounded text-white text-sm ${side === "buy" ? "bg-green-600" : "bg-red-600"}`}>
          {side === "buy" ? "LONG" : "SHORT"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-gray-500">Entry</p>
          <p className="font-medium">{entry}</p>
        </div>
        <div>
          <p className="text-gray-500">TP · {tpPercent}%</p>
          <p className="font-medium text-green-600">{tpPrice.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-gray-500">SL · {slPercent}%</p>
          <p className="font-medium text-red-600">{slPrice.toFixed(0)}</p>
        </div>
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <span>By {author} · {size} BTC · {holdHours}h</span>
        <span>{created}</span>
      </div>

      <button
        onClick={copy}
        disabled={loading}
        className="w-full rounded-xl py-2.5 font-semibold text-white bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Copying..." : `Copy ${side === "buy" ? "long" : "short"} · ${size} BTC`}
      </button>

      {status.kind === "ok" && (
        <p className="rounded-lg bg-green-100 text-green-700 p-2 text-sm">
          Trade copied! ✅ {status.hash && `Tx: ${status.hash.slice(0, 10)}…`}
        </p>
      )}
      {status.kind === "error" && (
        <p className="rounded-lg bg-red-100 text-red-700 p-2 text-sm">{status.msg}</p>
      )}
    </div>
  );
}
