/**
 * list-markets.ts — throwaway diagnostic.
 * Prints the real market names to find out what the BTC one is called
 * (markets.getByName("BTC-USD") returned null, so that's not the exact name).
 *
 * Run:
 *   npx tsx --env-file=.env.local src/scripts/list-markets.ts
 */

import { DecibelReadDex, TESTNET_CONFIG } from "@decibeltrade/sdk";

async function main() {
  const nodeApiKey = process.env.APTOS_NODE_API_KEY;
  if (!nodeApiKey) throw new Error("Missing APTOS_NODE_API_KEY in .env.local");

  const read = new DecibelReadDex(TESTNET_CONFIG, { nodeApiKey });

  const res: any = await read.markets.getAll();
  const arr: any[] = Array.isArray(res) ? res : res?.items ?? res?.markets ?? [];

  if (arr.length) {
    console.log(`Markets found: ${arr.length}\n`);
    for (const m of arr) {
      console.log(" -", m.market_name ?? m.name ?? JSON.stringify(m).slice(0, 80));
    }
    console.log("\nFull config of the first one:");
    console.log(JSON.stringify(arr[0], null, 2));
  } else {
    console.log("Could not extract an array; raw response from getAll():");
    console.log(JSON.stringify(res, null, 2).slice(0, 3000));
  }
}

main().catch((e) => {
  console.error("Error:", e?.message ?? e);
  process.exit(1);
});