import { listSignals } from "@/lib/signals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  author: string;
  count: number;
  longs: number;
  shorts: number;
  avgTp: number;
  avgSl: number;
  last: number;
};

export async function SignalLeaderboard() {
  const signals = await listSignals();
  if (signals.length === 0) return null;

  const byAuthor = new Map<string, Row>();
  for (const s of signals) {
    const r =
      byAuthor.get(s.author) ??
      { author: s.author, count: 0, longs: 0, shorts: 0, avgTp: 0, avgSl: 0, last: 0 };
    r.count += 1;
    if (s.side === "buy") r.longs += 1;
    else r.shorts += 1;
    r.avgTp += s.tpPercent;
    r.avgSl += s.slPercent;
    r.last = Math.max(r.last, s.createdAt);
    byAuthor.set(s.author, r);
  }

  const rows = [...byAuthor.values()]
    .map((r) => ({ ...r, avgTp: r.avgTp / r.count, avgSl: r.avgSl / r.count }))
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
                <th className="text-right!">Avg SL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
                  <td className="text-right text-loss">{r.avgSl.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
