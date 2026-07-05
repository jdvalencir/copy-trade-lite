/**
 * approve-builder.ts — ONE-TIME setup step (not part of the app).
 *
 * Approves the builder fee CAP (maxFee) for your own builder address.
 * IMPORTANT: the builder is identified by a SUBACCOUNT, not by the owner.
 * Since you are your own builder, we use your primary subaccount (the one that
 * already exists from the deposit). Passing the owner throws EBUILDER_SUBACCOUNT_NOT_FOUND.
 *
 * Run ONCE per account.
 *
 * Run:
 *   npx tsx --env-file=.env.local src/scripts/approve-builder.ts
 *
 * Requires in .env.local: APTOS_PRIVATE_KEY, APTOS_NODE_API_KEY
 * (No longer uses BUILDER_ADDR: the builder address is derived from your subaccount.)
 */

import { requireEnv } from "@/lib/utils";
import { Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { DecibelWriteDex, TESTNET_CONFIG } from "@decibeltrade/sdk";

const MAX_BUILDER_FEE = 10; // bps; same value as MAX_BUILDER_FEE in decibel.ts


async function main() {
  const rawKey = requireEnv("APTOS_PRIVATE_KEY").replace(/^ed25519-priv-/, "");
  const nodeApiKey = requireEnv("APTOS_NODE_API_KEY");

  const account = new Ed25519Account({
    privateKey: new Ed25519PrivateKey(rawKey),
  });

  const write = new DecibelWriteDex(TESTNET_CONFIG, account, {
    nodeApiKey,
    skipSimulate: true,
  });

  // The builder is you -> your primary subaccount, derived the SAME way and
  // padded to 64 chars exactly like BUILDER_ADDR in src/lib/decibel.ts, so the
  // address we approve here is the address the app attaches to orders.
  const subaccount = write.getPrimarySubaccountAddress(account.accountAddress).toString();
  const builderAddr = "0x" + subaccount.replace(/^0x/, "").padStart(64, "0");

  console.log("Account (owner):", account.accountAddress.toString());
  console.log("Builder addr (subaccount):", builderAddr);
  console.log(`Approving maxFee = ${MAX_BUILDER_FEE}...`);

  const res =   await write.approveMaxBuilderFee({
    builderAddr,
    maxFee: MAX_BUILDER_FEE,
  });

  console.log("Approved. Tx:", res.hash ?? res);
  console.log("Done: use THIS same builderAddr (your subaccount) when placing orders.");
}

main().catch((err) => {
  console.error("The approve failed:", err?.message ?? err);
  process.exit(1);
});