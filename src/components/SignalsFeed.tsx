"use client";
import { useEffect, useState } from "react";
import { Signal } from "@/lib/signals";
import { SignalLeaderboard } from "./SignalLeaderboard";
import { SignalsList } from "./SignalsList";

// Seeded with the server-rendered signals, then polls /api/signals so newly
// published signals appear on their own (no navigation/refresh needed).
export function SignalsFeed({ initialSignals }: { initialSignals: Signal[] }) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/signals");
        const json = await res.json();
        if (active && res.ok && Array.isArray(json.signals)) setSignals(json.signals);
      } catch {
        /* keep the current signals on failure */
      }
    }
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-4">
      <SignalLeaderboard signals={signals} />
      <SignalsList signals={signals} />
    </div>
  );
}
