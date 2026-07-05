"use client";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  price: {
    label: "Price",
    theme: { light: "oklch(0.5 0.2 255)", dark: "oklch(0.72 0.16 255)" },
  },
} satisfies ChartConfig;

type Point = { t: number; price: number };

// Live price chart for one signal. Seeds with the true entry at its creation
// time (real data), then appends observed live prices fed via the `price` prop
// (from the shared poller). TP / SL / Entry are drawn as reference lines.
export function SignalChart({
  entry,
  tpPrice,
  slPrice,
  createdAt,
  price,
}: {
  entry: number;
  tpPrice: number;
  slPrice: number;
  createdAt: number;
  price: number | null;
}) {
  const [points, setPoints] = useState<Point[]>([{ t: createdAt, price: entry }]);

  useEffect(() => {
    if (price == null) return;
    setPoints((prev) => [...prev, { t: Date.now(), price }].slice(-40));
  }, [price]);

  const prices = points.map((p) => p.price);
  const lo = Math.min(slPrice, tpPrice, ...prices);
  const hi = Math.max(slPrice, tpPrice, ...prices);
  const pad = (hi - lo) * 0.12 || 1;
  const profitTop = Math.max(entry, tpPrice);
  const profitBot = Math.min(entry, tpPrice);
  const lossTop = Math.max(entry, slPrice);
  const lossBot = Math.min(entry, slPrice);

  return (
    <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
      <LineChart data={points} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          type="number"
          domain={["dataMin", "dataMax"]}
          scale="time"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          minTickGap={40}
          tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          className="text-[10px]"
        />
        <YAxis
          domain={[lo - pad, hi + pad]}
          width={48}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tickFormatter={(v) => Number(v).toFixed(0)}
          className="text-[10px]"
        />

        {/* profit / loss zones */}
        <ReferenceArea y1={profitBot} y2={profitTop} fill="var(--profit)" fillOpacity={0.08} />
        <ReferenceArea y1={lossBot} y2={lossTop} fill="var(--loss)" fillOpacity={0.08} />

        {/* plan levels — short labels inside the plot so they never clip
            (the exact prices are shown in the card header above) */}
        <ReferenceLine y={tpPrice} stroke="var(--profit)" strokeWidth={1.5}
          label={{ value: "TP", position: "insideTopRight", fill: "var(--profit)", fontSize: 10 }} />
        <ReferenceLine y={slPrice} stroke="var(--loss)" strokeWidth={1.5}
          label={{ value: "SL", position: "insideBottomRight", fill: "var(--loss)", fontSize: 10 }} />
        <ReferenceLine y={entry} stroke="var(--muted-foreground)" strokeDasharray="4 4"
          label={{ value: "Entry", position: "insideRight", fill: "var(--muted-foreground)", fontSize: 10 }} />

        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0] ? new Date(payload[0].payload.t).toLocaleTimeString() : ""
              }
            />
          }
        />
        <Line
          dataKey="price"
          type="monotone"
          stroke="var(--color-price)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
