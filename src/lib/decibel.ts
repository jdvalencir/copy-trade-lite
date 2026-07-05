import { Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { DecibelReadDex, DecibelWriteDex, TESTNET_CONFIG } from "@decibeltrade/sdk";
import "server-only";
import { requireEnv } from "./utils";

const PRIVATE_KEY = requireEnv("APTOS_PRIVATE_KEY").replace(/^ed25519-priv-/, "");
const NODE_API_KEY = requireEnv("APTOS_NODE_API_KEY");

// Signing wallet
export const account = new Ed25519Account({
  privateKey: new Ed25519PrivateKey(PRIVATE_KEY),
});

// SDK clients
export const read = new DecibelReadDex(TESTNET_CONFIG, { nodeApiKey: NODE_API_KEY });
export const write = new DecibelWriteDex(TESTNET_CONFIG, account, {
  nodeApiKey: NODE_API_KEY,
  skipSimulate: true,
});

// The TWO addresses (don't mix them up!)
export const OWNER = account.accountAddress.toString();               // for accountOverview
export const SUBACCOUNT = write.getPrimarySubaccountAddress(account.accountAddress).toString();

// Constants
export const MARKET = "BTC/USD";
export const MAX_BUILDER_FEE = 10;
export const BUILDER_FEE = 10; // always <= MAX_BUILDER_FEE (safety lock)
export const BUILDER_ADDR = SUBACCOUNT
export const USE_BUILDER_CODE = false; 