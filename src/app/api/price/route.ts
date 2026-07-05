import { MARKET, read } from "@/lib/decibel";
import { NextResponse } from "next/server";
import "server-only";

export async function GET() {
  try {
    const prices: any = await read.marketPrices.getByName({ marketName: MARKET });
    const priceData = Array.isArray(prices) ? prices[0] : prices;
    const price = Number(priceData?.mid_px ?? priceData?.mark_px);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Could not read the live price." }, { status: 502 });
    }
    return NextResponse.json({ market: MARKET, price });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error reading the price." },
      { status: 502 },
    );
  }
}
