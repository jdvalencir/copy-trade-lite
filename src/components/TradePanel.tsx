"use client";
import { useState } from "react";

type Side = "buy" | "sell";
type Status =
  | { kind: "idle" | "loading" }
  | { kind: "ok"; hash: string }
  | { kind: "error"; msg: string };

export function TradePanel() {
  const [side, setSide] = useState<Side>("buy");
  const [size, setSize] = useState("0.001");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit() {
    const n = Number(size);
    if (!Number.isFinite(n) || n <= 0) {
      setStatus({ kind: "error", msg: "Enter a size greater than 0." });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBuy: side === "buy", size: n }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({ kind: "error", msg: json.error ?? "Could not execute the order." });
      } else {
        setStatus({ kind: "ok", hash: json.hash ?? "" });
      }
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  }

  const loading = status.kind === "loading";

  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <h2 className="text-lg font-semibold">Trade BTC</h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide("buy")}
          className={`rounded-xl py-3 font-semibold ${
            side === "buy" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`rounded-xl py-3 font-semibold ${
            side === "sell" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Sell
        </button>
      </div>

      <div>
        <label className="text-sm text-gray-500">Size (BTC)</label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full rounded-xl border p-3 mt-1"
        />
        <div className="flex gap-2 mt-2">
          {["0.001", "0.005", "0.01"].map((v) => (
            <button
              key={v}
              onClick={() => setSize(v)}
              className="text-sm rounded-lg border px-3 py-1 text-gray-600"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className={`w-full rounded-2xl py-4 text-lg font-bold text-white disabled:opacity-50 ${
          side === "buy" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {loading ? "Sending..." : side === "buy" ? "Buy BTC" : "Sell BTC"}
      </button>

      {status.kind === "ok" && (
        <p className="rounded-lg bg-green-100 text-green-700 p-3 text-sm">
          Order executed! ✅ {status.hash && `Tx: ${status.hash.slice(0, 10)}…`}
        </p>
      )}
      {status.kind === "error" && (
        <p className="rounded-lg bg-red-100 text-red-700 p-3 text-sm">{status.msg}</p>
      )}
    </div>
  );
}