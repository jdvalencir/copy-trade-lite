import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SignalWithOutcome } from "@/lib/signal-types";
import { cn } from "@/lib/utils";

type Row = {
  author: string;
  count: number;
  longs: number;
  shorts: number;
  avgTp: number;
  wins: number; // hit TP
  losses: number; // hit SL
  last: number;
};

export function SignalLeaderboard({ signals }: { signals: SignalWithOutcome[] }) {
  if (signals.length === 0) return null;

  const byAuthor = new Map<string, Row>();
  for (const s of signals) {
    const r =
      byAuthor.get(s.author) ??
      { author: s.author, count: 0, longs: 0, shorts: 0, avgTp: 0, wins: 0, losses: 0, last: 0 };
    r.count += 1;
    if (s.side === "buy") r.longs += 1;
    else r.shorts += 1;
    r.avgTp += s.tpPercent;
    if (s.outcome === "tp") r.wins += 1;
    if (s.outcome === "sl") r.losses += 1;
    r.last = Math.max(r.last, s.createdAt);
    byAuthor.set(s.author, r);
  }

  const rows = [...byAuthor.values()]
    .map((r) => ({ ...r, avgTp: r.avgTp / r.count }))
    .sort((a, b) => b.count - a.count || b.last - a.last);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Author leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b [&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                <th>Author</th>
                <th className="text-right!">Signals</th>
                <th className="text-right!">Long / Short</th>
                <th className="text-right!">Avg TP</th>
                <th className="text-right!">Win rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const resolved = r.wins + r.losses;
                const winRate = resolved > 0 ? (r.wins / resolved) * 100 : null;
                return (
                  <tr
                    key={r.author}
                    className="border-b last:border-0 [&>td]:px-4 [&>td]:py-2 tabular-nums"
                  >
                    <td className="font-medium">{r.author}</td>
                    <td className="text-right">{r.count}</td>
                    <td className="text-right">
                      <span className="text-profit">{r.longs}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-loss">{r.shorts}</span>
                    </td>
                    <td className="text-right text-profit">{r.avgTp.toFixed(1)}%</td>
                    <td className="text-right">
                      {winRate == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={cn(winRate >= 50 ? "text-profit" : "text-loss")}>
                          {winRate.toFixed(0)}%
                          <span className="text-muted-foreground"> ({r.wins}-{r.losses})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
