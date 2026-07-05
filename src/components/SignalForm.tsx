"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Status =
  | { kind: "idle" | "loading" }
  | { kind: "ok" }
  | { kind: "error"; msg: string };

export function SignalForm({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const [author, setAuthor] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [tpPercent, setTp] = useState("3");
  const [slPercent, setSl] = useState("2");
  const [holdHours, setHold] = useState("4");
  const [size, setSize] = useState("0.001");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit() {
    const nums = {
      tpPercent: Number(tpPercent),
      slPercent: Number(slPercent),
      holdHours: Number(holdHours),
      size: Number(size),
    };
    for (const [k, v] of Object.entries(nums)) {
      if (!Number.isFinite(v) || v <= 0) {
        setStatus({ kind: "error", msg: `Check the ${k} field: it must be greater than 0.` });
        return;
      }
    }
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim() || "anon", side, ...nums }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({ kind: "error", msg: json.error ?? "Could not create the signal." });
      } else {
        setStatus({ kind: "ok" });
        router.refresh(); // re-renders the list server component
        onCreated?.(); // notify the parent in case it wants to react too
      }
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  }

  const loading = status.kind === "loading";
  const field = "w-full rounded-xl border p-2 mt-1";

  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <h2 className="text-lg font-semibold">Publish a signal</h2>
      <p className="text-sm text-gray-500">
        The entry is taken from the live price when publishing. You define TP, SL and duration.
      </p>

      <div>
        <label className="text-sm text-gray-500">Author</label>
        <input value={author} onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name" className={field} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setSide("buy")}
          className={`rounded-xl py-2 font-semibold ${side === "buy" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Long
        </button>
        <button onClick={() => setSide("sell")}
          className={`rounded-xl py-2 font-semibold ${side === "sell" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Short
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm text-gray-500">TP %</label>
          <input type="number" step="0.5" value={tpPercent} onChange={(e) => setTp(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-sm text-gray-500">SL %</label>
          <input type="number" step="0.5" value={slPercent} onChange={(e) => setSl(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-sm text-gray-500">Hours</label>
          <input type="number" step="1" value={holdHours} onChange={(e) => setHold(e.target.value)} className={field} />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-500">Size (BTC)</label>
        <input type="number" step="0.001" value={size} onChange={(e) => setSize(e.target.value)} className={field} />
      </div>

      <button onClick={submit} disabled={loading}
        className="w-full rounded-2xl py-3 font-bold text-white bg-blue-600 disabled:opacity-50">
        {loading ? "Publishing..." : "Publish signal"}
      </button>

      {status.kind === "ok" && (
        <p className="rounded-lg bg-green-100 text-green-700 p-3 text-sm">Signal published! ✅</p>
      )}
      {status.kind === "error" && (
        <p className="rounded-lg bg-red-100 text-red-700 p-3 text-sm">{status.msg}</p>
      )}
    </div>
  );
}