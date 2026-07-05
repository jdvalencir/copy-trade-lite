/**
 * setup-usdc.ts — ONE-TIME setup step (not part of the app).
 *
 * STATE: the mint is ALREADY done (you have 500 USDC in the wallet). DO_MINT = false
 * so it isn't retried (it would throw E_MINT_ACCOUNT_LIMIT_EXCEEDED). This script only
 * DEPOSITS that USDC into your trading subaccount.
 *
 * FIX for the gas error (MAX_GAS_UNITS_EXCEEDS_MAX_GAS_UNITS_BOUND):
 *   skipSimulate: true. When simulating (false), the SDK sets the gas cap to
 *   the network maximum, which exceeds the testnet limit. With skipSimulate:
 *   true it uses a fixed cap that fits. (It's what the test snippet ships with;
 *   use this SAME setting in your app's Write SDK so placeOrder doesn't hit
 *   the same issue.)
 *
 * Run (loads variables from .env.local):
 *   npx tsx --env-file=.env.local src/scripts/setup-usdc.ts
 *
 * Requires in .env.local: PRIVATE_KEY, APTOS_NODE_API_KEY
 * Gas: paid with your testnet APT. Do NOT configure gasStationApiKey.
 */

import { Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import {
    DecibelReadDex,
    DecibelWriteDex,
    GasPriceManager,
    TESTNET_CONFIG,
} from "@decibeltrade/sdk";

// USDC = 6 decimals -> 1 USDC = 1_000_000 chain units.
const DO_MINT = false; // already minted; leave it as false
const MINT_AMOUNT = 500_000_000; // 500 USDC (only if DO_MINT = true)
const DEPOSIT_AMOUNT = 400_000_000; // 400 USDC to collateral (<= what you hold in wallet)

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Missing variable ${name} in .env.local`);
  return v;
}

async function main() {
  const rawKey = requireEnv("APTOS_PRIVATE_KEY").replace(/^ed25519-priv-/, "");
  const nodeApiKey = requireEnv("APTOS_NODE_API_KEY");

  const account = new Ed25519Account({
    privateKey: new Ed25519PrivateKey(rawKey),
  });

  const gas = new GasPriceManager(TESTNET_CONFIG);
  await gas.initialize();

  const read = new DecibelReadDex(TESTNET_CONFIG, { nodeApiKey });
  const write = new DecibelWriteDex(TESTNET_CONFIG, account, {
    nodeApiKey,
    gasPriceManager: gas,
    skipSimulate: true, // <-- the gas-error fix
  });

  console.log("Account (wallet):", account.accountAddress.toString());

  const primarySubaccount = write.getPrimarySubaccountAddress(account.accountAddress);
  console.log("Trading subaccount:", primarySubaccount);

  // 1) MINT (off by default).
  if (DO_MINT) {
    console.log(`\nMinting ${MINT_AMOUNT / 1e6} USDC...`);
    const mintTx = await write.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${write.config.deployment.package}::usdc::restricted_mint`,
        typeArguments: [],
        functionArguments: [MINT_AMOUNT],
      },
    });
    const mintRes = await write.aptos.signAndSubmitTransaction({
      signer: account,
      transaction: mintTx,
    });
    await write.aptos.waitForTransaction({ transactionHash: mintRes.hash });
    console.log("USDC minted. Tx:", mintRes.hash);
  }

  // 2) DEPOSIT — moves the USDC from the wallet to the subaccount (collateral).
  console.log(`\nDepositing ${DEPOSIT_AMOUNT / 1e6} USDC to the subaccount...`);
  const depositRes = await write.deposit(DEPOSIT_AMOUNT, primarySubaccount);
  console.log("Deposit done. Tx:", depositRes.hash ?? depositRes);

  // 3) VERIFY — you should see collateral/equity > 0.
  try {
    const overview = await read.accountOverview.getByAddr(account.accountAddress.toString());
    console.log("\naccountOverview:", JSON.stringify(overview, null, 2));
    console.log("\nIf you see collateral/equity > 0, the setup is ready.");
  } catch (e) {
    console.warn(
      "\nThe deposit went through, but I couldn't read accountOverview automatically.",
      "Verify it in Block 2. Detail:",
      (e).message,
    );
  }
}

main().catch((err) => {
  console.error("\nThe setup failed:", err?.message ?? err);
  process.exit(1);
});