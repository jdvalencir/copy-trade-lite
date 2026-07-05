"use client"

import { fmt } from '@/lib/utils';
import { useEffect, useState } from "react";

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
};

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


if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

 return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-100 text-red-700 p-3">{error}</div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-gray-500">Equity</p>
              <p className="text-xl font-semibold">{fmt(data.overview.perp_equity_balance)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-xl font-semibold">{fmt(data.overview.cross_available_to_trade)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-gray-500">Unrealized PnL</p>
              <p className={`text-xl font-semibold ${data.overview.unrealized_pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fmt(data.overview.unrealized_pnl)}
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-2">Open positions</h2>
            {data.positions.length === 0 ? (
              <p className="text-gray-500">You have no open positions.</p>
            ) : (
              <ul className="space-y-2">
                {data.positions.map((p, i) => (
                  <li key={i} className="rounded-lg border p-3 flex justify-between items-center">
                    <span className="font-medium">
                      {p.size >= 0 ? "Long" : "Short"} BTC-USD · {Math.abs(p.size)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Entry {fmt(p.entry_price)} · Liq {fmt(p.estimated_liquidation_price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Open orders</h2>
            {data.openOrders.items.length === 0 ? (
              <p className="text-gray-500">You have no open orders.</p>
            ) : (
              <ul className="space-y-2">
                {data.openOrders.items.map((o) => (
                  <li key={o.order_id} className="rounded-lg border p-3 flex justify-between items-center">
                    <span className="font-medium">
                      {o.is_buy ? "Buy" : "Sell"} BTC-USD · {o.remaining_size ?? "-"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {o.price != null ? fmt(o.price) : "Market"}
                    </span>
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