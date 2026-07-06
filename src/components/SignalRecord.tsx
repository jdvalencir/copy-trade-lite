"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { SignalWithOutcome } from "@/lib/signal-types";
import { useLivePrice } from "@/lib/useLivePrice";
import { cn } from "@/lib/utils";
import { SignalChart } from "./SignalChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const OUTCOME_BADGE = {
  tp: { label: "Hit TP", className: "bg-profit text-white" },
  sl: { label: "Hit SL", className: "bg-loss text-white" },
  expired: { label: "Expired", className: "" },
  active: { label: "Active", className: "" },
} as const;

export function SignalRecord({ signal }: { signal: SignalWithOutcome }) {
  const { author, market, side, entry, tpPercent, slPercent, holdHours, size, createdAt, outcome } = signal;
  const created = new Date(createdAt).toLocaleString();
  const [loading, setLoading] = useState(false);
  const now = useLivePrice();

  // Target prices derived from the frozen entry (long: TP above, SL below)
  const dir = side === "buy" ? 1 : -1;
  const tpPrice = entry * (1 + (dir * tpPercent) / 100);
  const slPrice = entry * (1 - (dir * slPercent) / 100);

  const isActive = outcome === "active";
  const badge = OUTCOME_BADGE[outcome];

  // Live (not historical) read of where the price sits vs the plan — only while
  // the signal is still active. dir folds long/short so "toward TP" is profit.
  let live: { label: string; tone: "profit" | "loss" | "muted" } | null = null;
  if (isActive && now != null) {
    if (dir * (now - tpPrice) >= 0) live = { label: "Live · past TP", tone: "profit" };
    else if (dir * (now - slPrice) <= 0) live = { label: "Live · past SL", tone: "loss" };
    else live = { label: "Live · in range", tone: "muted" };
  }

  async function copy() {
    setLoading(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBuy: side === "buy", size }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not copy the trade.");
      } else {
        toast.success("Trade copied!", {
          description: json.hash ? `Tx: ${json.hash.slice(0, 12)}…` : undefined,
        });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{market}</span>
          <Badge className={side === "buy" ? "bg-profit text-white" : "bg-loss text-white"}>
            {side === "buy" ? "LONG" : "SHORT"}
          </Badge>
          <Badge
            variant={badge.className ? "default" : outcome === "expired" ? "secondary" : "outline"}
            className={badge.className}
          >
            {badge.label}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{created}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Entry</p>
            <p className="font-medium tabular-nums">{entry.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">TP · {tpPercent}%</p>
            <p className="font-medium tabular-nums text-profit">{tpPrice.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">SL · {slPercent}%</p>
            <p className="font-medium tabular-nums text-loss">{slPrice.toFixed(0)}</p>
          </div>
        </div>

        <SignalChart entry={entry} tpPrice={tpPrice} slPrice={slPrice} createdAt={createdAt} price={now} />

        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>By {author} · {size} BTC · {holdHours}h</span>
          {live && (
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                live.tone === "profit" && "text-profit",
                live.tone === "loss" && "text-loss",
                live.tone === "muted" && "text-muted-foreground",
              )}
            >
              {live.label}
            </span>
          )}
        </div>

        <Button className="w-full" disabled={loading || !isActive} onClick={copy}>
          {!isActive
            ? `Signal ${outcome === "tp" ? "hit TP" : outcome === "sl" ? "hit SL" : "expired"}`
            : loading
              ? "Copying..."
              : `Copy ${side === "buy" ? "long" : "short"} · ${size} BTC`}
        </Button>
      </CardContent>
    </Card>
  );
}
