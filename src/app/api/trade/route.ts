import {
    BUILDER_ADDR, BUILDER_FEE,
    MARKET,
    MAX_BUILDER_FEE,
    read,
    USE_BUILDER_CODE,
    write,
} from "@/lib/decibel";
import { TimeInForce } from "@decibeltrade/sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1) Validate BEFORE signing
    const body = await req.json().catch(() => null);
    if (!body || typeof body.isBuy !== "boolean") {
      return NextResponse.json({ error: "Missing side (buy/sell)." }, { status: 400 });
    }
    const isBuy: boolean = body.isBuy;
    const size = Number(body.size);
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "Size must be a positive number." }, { status: 400 });
    }
    if (BUILDER_FEE > MAX_BUILDER_FEE) {
      return NextResponse.json({ error: "builderFee exceeds the approved maximum." }, { status: 400 });
    }

    // 2) Config via getAll() + live price
    const all: any = await read.markets.getAll();
    const list: any[] = Array.isArray(all) ? all : all?.items ?? all?.markets ?? [];
    const market = list.find((m) => m.market_name === MARKET);
    if (!market) {
      return NextResponse.json({ error: "Market not found." }, { status: 502 });
    }

    const pricesRes: any = await read.marketPrices.getByName({ marketName: MARKET });
    const priceData = Array.isArray(pricesRes) ? pricesRes[0] : pricesRes;
    const mark = Number(priceData?.mid_px ?? priceData?.mark_px);
    if (!Number.isFinite(mark) || mark <= 0) {
      return NextResponse.json({ error: "Could not read the market price." }, { status: 502 });
    }

    // 3) Crossing price + conversion to CHAIN UNITS (integers), rounded to tick/lot
    const rawPrice = isBuy ? mark * 1.01 : mark * 0.99;
    const priceChain =
      Math.round((rawPrice * 10 ** market.px_decimals) / market.tick_size) * market.tick_size;
    let sizeChain =
      Math.round((size * 10 ** market.sz_decimals) / market.lot_size) * market.lot_size;
    if (sizeChain < market.min_size) sizeChain = market.min_size;

    // Anti-NaN lock: valid positive integers before signing
    if (!Number.isInteger(priceChain) || priceChain <= 0 ||
        !Number.isInteger(sizeChain) || sizeChain <= 0) {
      return NextResponse.json(
        { error: "Invalid price or size after conversion." }, { status: 500 },
      );
    }

    // 4) Place the order
    console.log("placeOrder ->", { marketName: MARKET, priceChain, sizeChain, isBuy });
    const result = await write.placeOrder({
      marketName: MARKET,
      price: priceChain,
      size: sizeChain,
      isBuy,
      timeInForce: TimeInForce.ImmediateOrCancel,
      isReduceOnly: false,
      ...(USE_BUILDER_CODE
        ? { builderAddr: BUILDER_ADDR, builderFee: BUILDER_FEE }
        : {}),
    });

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error ?? "The order was rejected." }, { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, hash: result.transactionHash ?? null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message ?? "The order failed." }, { status: 400 });
  }
}