"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SignalForm({ onCreated }: { onCreated?: () => void }) {
  const [author, setAuthor] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [tpPercent, setTp] = useState("3");
  const [slPercent, setSl] = useState("2");
  const [holdHours, setHold] = useState("4");
  const [size, setSize] = useState("0.001");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const nums = {
      tpPercent: Number(tpPercent),
      slPercent: Number(slPercent),
      holdHours: Number(holdHours),
      size: Number(size),
    };
    for (const [k, v] of Object.entries(nums)) {
      if (!Number.isFinite(v) || v <= 0) {
        toast.error(`Check the ${k} field: it must be greater than 0.`);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim() || "anon", side, ...nums }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not create the signal.");
      } else {
        toast.success("Signal published!", {
          description: "It will show up on the main page shortly.",
        });
        onCreated?.();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New signal</CardTitle>
        <CardDescription>
          The entry is taken from the live price when publishing. You define TP, SL and duration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={side === "buy" ? "default" : "outline"}
            className={cn(side === "buy" && "bg-profit text-white hover:bg-profit/90")}
            onClick={() => setSide("buy")}
          >
            Long
          </Button>
          <Button
            type="button"
            variant={side === "sell" ? "default" : "outline"}
            className={cn(side === "sell" && "bg-loss text-white hover:bg-loss/90")}
            onClick={() => setSide("sell")}
          >
            Short
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label htmlFor="tp">TP %</Label>
            <Input id="tp" type="number" step="0.5" value={tpPercent} onChange={(e) => setTp(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sl">SL %</Label>
            <Input id="sl" type="number" step="0.5" value={slPercent} onChange={(e) => setSl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hold">Hours</Label>
            <Input id="hold" type="number" step="1" value={holdHours} onChange={(e) => setHold(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signal-size">Size (BTC)</Label>
          <Input id="signal-size" type="number" step="0.001" value={size} onChange={(e) => setSize(e.target.value)} />
        </div>

        <Button className="w-full" size="lg" disabled={loading} onClick={submit}>
          {loading ? "Publishing..." : "Publish signal"}
        </Button>
      </CardContent>
    </Card>
  );
}
