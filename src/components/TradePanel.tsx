"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Side = "buy" | "sell";

export function TradePanel() {
  const [side, setSide] = useState<Side>("buy");
  const [size, setSize] = useState("0.001");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const n = Number(size);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a size greater than 0.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBuy: side === "buy", size: n }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not execute the order.");
      } else {
        toast.success("Order executed!", {
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
      <CardHeader>
        <CardTitle>Trade BTC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={side === "buy" ? "default" : "outline"}
            className={cn(side === "buy" && "bg-profit text-white hover:bg-profit/90")}
            onClick={() => setSide("buy")}
          >
            Buy
          </Button>
          <Button
            type="button"
            variant={side === "sell" ? "default" : "outline"}
            className={cn(side === "sell" && "bg-loss text-white hover:bg-loss/90")}
            onClick={() => setSide("sell")}
          >
            Sell
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade-size">Size (BTC)</Label>
          <Input
            id="trade-size"
            type="number"
            step="0.001"
            min="0"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
          <div className="flex gap-2">
            {["0.001", "0.005", "0.01"].map((v) => (
              <Button
                key={v}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSize(v)}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>

        <Button
          className={cn(
            "w-full text-white",
            side === "buy" ? "bg-profit hover:bg-profit/90" : "bg-loss hover:bg-loss/90",
          )}
          size="lg"
          disabled={loading}
          onClick={submit}
        >
          {loading ? "Sending..." : side === "buy" ? "Buy BTC" : "Sell BTC"}
        </Button>
      </CardContent>
    </Card>
  );
}
