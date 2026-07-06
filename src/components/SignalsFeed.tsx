"use client";
import { useEffect, useState } from "react";
import type { SignalWithOutcome } from "@/lib/signal-types";
import { SignalLeaderboard } from "./SignalLeaderboard";
import { SignalsList } from "./SignalsList";

// Seeded with the server-rendered signals, then polls /api/signals so newly
// published signals (and updated outcomes) appear on their own.
export function SignalsFeed({ initialSignals }: { initialSignals: SignalWithOutcome[] }) {
  const [signals, setSignals] = useState<SignalWithOutcome[]>(initialSignals);

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
