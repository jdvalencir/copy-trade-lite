import { read, SUBACCOUNT } from "@/lib/decibel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [overview, positions, openOrders] = await Promise.all([
      read.accountOverview.getByAddr({ subAddr: SUBACCOUNT }),
      read.userPositions.getByAddr({ subAddr: SUBACCOUNT }),
      read.userOpenOrders.getByAddr({ subAddr: SUBACCOUNT }),
    ]);

    console.log("overview:", JSON.stringify(overview, null, 2));
    console.log("positions:", JSON.stringify(positions, null, 2));
    console.log("openOrders:", JSON.stringify(openOrders, null, 2));

    return NextResponse.json({ overview, positions, openOrders });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error reading the account" },
      { status: 502 },
    );
  }
}