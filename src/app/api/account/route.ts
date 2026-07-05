import { MARKET, read, SUBACCOUNT } from "@/lib/decibel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [overview, positions, openOrders, prices] = await Promise.all([
      read.accountOverview.getByAddr({ subAddr: SUBACCOUNT }),
      read.userPositions.getByAddr({ subAddr: SUBACCOUNT }),
      read.userOpenOrders.getByAddr({ subAddr: SUBACCOUNT }),
      read.marketPrices.getByName({ marketName: MARKET }),
    ]);

    // userPositions has no per-position PnL, so we surface the live mark price
    // and let the client compute (mark - entry) * size.
    const priceData: any = Array.isArray(prices) ? prices[0] : prices;
    const markPrice = Number(priceData?.mid_px ?? priceData?.mark_px) || null;

    return NextResponse.json({ overview, positions, openOrders, markPrice });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error reading the account" },
      { status: 502 },
    );
  }
}