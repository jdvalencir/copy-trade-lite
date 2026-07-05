"use client";
import { useState } from "react";
import { Signal } from "@/lib/signals";
import { SignalRecord } from "./SignalRecord";
import { Button } from "@/components/ui/button";

type Filter = "active" | "expired" | "all";

const isExpired = (s: Signal) => Date.now() > s.createdAt + s.holdHours * 3_600_000;

export function SignalsList({ signals }: { signals: Signal[] }) {
  const [filter, setFilter] = useState<Filter>("active");

  if (signals.length === 0) {
    return <p className="text-muted-foreground text-sm">No signals yet. Publish the first one.</p>;
  }

  const activeCount = signals.filter((s) => !isExpired(s)).length;
  const expiredCount = signals.length - activeCount;

  const shown = signals.filter((s) => {
    if (filter === "active") return !isExpired(s);
    if (filter === "expired") return isExpired(s);
    return true;
  });

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeCount },
    { key: "expired", label: "Expired", count: expiredCount },
    { key: "all", label: "All", count: signals.length },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={filter === t.key ? "default" : "outline"}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            <span className="ml-1 opacity-60">{t.count}</span>
          </Button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No {filter === "all" ? "" : `${filter} `}signals.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((signal) => (
            <SignalRecord key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}
