"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, fmt } from "@/lib/utils";

type Overview = {
  perp_equity_balance: number;
  cross_available_to_trade: number;
  unrealized_pnl: number;
};
type Position = {
  size: number;
  entry_price: number;
  estimated_liquidation_price: number;
  user_leverage: number;
};
type OpenOrder = {
  order_id: string;
  is_buy: boolean;
  price: number | null;
  remaining_size: number | null;
};
type AccountData = {
  overview: Overview;
  positions: Position[];
  openOrders: { items: OpenOrder[]; total_count?: number };
  markPrice: number | null;
};

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("text-xl font-semibold tabular-nums", className)}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/account");
        const json = await res.json();
        if (!active) return;
        if (!res.ok) setError(json.error ?? "Error loading the account");
        else {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Equity" value={fmt(data.overview.perp_equity_balance)} />
            <Stat label="Available" value={fmt(data.overview.cross_available_to_trade)} />
            <Stat
              label="Unrealized PnL"
              value={fmt(data.overview.unrealized_pnl)}
              className={data.overview.unrealized_pnl >= 0 ? "text-profit" : "text-loss"}
            />
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-2">Open positions</h2>
            {data.positions.length === 0 ? (
              <p className="text-muted-foreground text-sm">You have no open positions.</p>
            ) : (
              <ul className="space-y-2">
                {data.positions.map((p, i) => {
                  // No per-position PnL from the SDK, so estimate the unrealized
                  // PnL from the live mark price (excludes funding/fees).
                  const pnl = data.markPrice != null ? (data.markPrice - p.entry_price) * p.size : null;
                  return (
                    <li key={i}>
                      <Card>
                        <CardContent className="p-3 space-y-1">
                          <div className="flex justify-between items-center gap-3">
                            <span className="font-medium flex items-center gap-2 whitespace-nowrap">
                              <Badge className={p.size >= 0 ? "bg-profit text-white" : "bg-loss text-white"}>
                                {p.size >= 0 ? "Long" : "Short"}
                              </Badge>
                              BTC-USD · {Math.abs(p.size)}
                            </span>
                            {pnl != null && (
                              <span className={cn("text-sm font-medium tabular-nums whitespace-nowrap", pnl >= 0 ? "text-profit" : "text-loss")}>
                                {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
                            <span>
                              Entry <span className="text-foreground font-medium">{fmt(p.entry_price)}</span>
                            </span>
                            <span>
                              Liq{" "}
                              <span className="text-foreground font-medium">
                                {p.estimated_liquidation_price > 0 ? fmt(p.estimated_liquidation_price) : "—"}
                              </span>
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Open orders</h2>
            {data.openOrders.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">You have no open orders.</p>
            ) : (
              <ul className="space-y-2">
                {data.openOrders.items.map((o) => (
                  <li key={o.order_id}>
                    <Card>
                      <CardContent className="p-3 flex justify-between items-center gap-3">
                        <span className="font-medium flex items-center gap-2 whitespace-nowrap">
                          <Badge variant={o.is_buy ? "default" : "secondary"}>
                            {o.is_buy ? "Buy" : "Sell"}
                          </Badge>
                          BTC-USD · {o.remaining_size ?? "-"}
                        </span>
                        <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                          {o.price != null ? fmt(o.price) : "Market"}
                        </span>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
