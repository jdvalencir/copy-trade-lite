# Copy-Trade Lite

A dead-simple perpetuals trading app with a copy-trade signals feature, built on **Decibel** (Aptos testnet). Anyone can place a one-click BTC trade, publish a trade idea ("signal"), and copy someone else's signal into their own account with a single button.

> **Testnet only. No real funds anywhere.** All config uses `TESTNET_CONFIG`.

---

## Tiers implemented

**MUST (core)**
- [x] Connect to Decibel on Aptos testnet and authenticate an account (hardcoded test key from env).
- [x] Place a real trade on testnet using **builder codes** (two-step approve → place), with my own registered builder address.
- [x] Simplified kid-friendly trade screen: pick Buy/Sell, pick a size, one big button.
- [x] Live account state: equity, open positions (with PnL), open orders. Polling every 4s.

**SHOULD (copy-trade)**
- [x] Signal authoring: side, TP %, SL %, hold duration, size. **Entry is auto-filled from the live market price** at publish time (server-side).
- [x] Chart per signal showing price with entry / TP / SL lines (correct sides for long vs short).
- [x] One-click copy: reuses the same trade route to submit the equivalent order from the caller's account.
- [x] Signal history persisted to a JSON file and listed.

**STRETCH**
- [x] Author leaderboard (from signal history).
- [x] Signal Active / Expired marking (based on hold duration).

**Extra safety hardening**
- [x] Input validation before signing (positive/finite size, valid side, collateral-based size cap).
- [x] `builderFee <= maxFee` lock enforced server-side.
- [x] Private key never leaves the server (`import "server-only"`).

---

## Stack

- **Next.js (App Router) + TypeScript + Tailwind**
- `@decibeltrade/sdk` **v0.7.0** and `@aptos-labs/ts-sdk`
- Aptos testnet via a **Geomi** Node API key
- Signal persistence: local JSON file (`data/signals.json`)

---

## Architecture

```
src/
  lib/
    decibel.ts        # server-only core: read/write SDK clients, account, addresses, constants
    signals.ts        # server-only signal persistence (JSON) + validation
    utils.ts          # requireEnv helper
  app/
    api/
      account/route.ts   # GET  – dashboard reads (overview, positions, open orders)
      trade/route.ts     # POST – validate, price, convert, place order
      signals/route.ts   # GET list / POST create (captures live entry price)
    page.tsx             # dashboard + trade panel + signals
  components/
    TradePanel.tsx    Dashboard.tsx    SignalForm.tsx   (+ signal cards / chart / leaderboard)
  scripts/
    setup-usdc.ts     # one-time: mint testnet USDC + deposit as collateral
    approve-builder.ts# one-time: approve max builder fee for my builder subaccount
    list-markets.ts   # diagnostic: list real market names
data/
  signals.json        # generated at runtime (gitignored)
```

**Golden rule:** everything that signs lives on the server. The Write SDK and the private key are only used inside API routes / scripts; the browser only `fetch`es our own routes.

---

## Setup & run

### Prerequisites
- Node 18+
- Aptos CLI (to generate a testnet account)
- A Geomi Node API key (testnet) — https://geomi.dev

### 1. Install
```bash
npm install
```

### 2. Create a testnet account
```bash
aptos init --network testnet
```
Grab `private_key` from the generated `.aptos/config.yaml`.

### 3. Fund APT for gas
Use the web faucet (Google sign-in): https://aptos.dev/network/faucet → paste your address → request APT.

### 4. Environment
Create `.env.local` (gitignored):
```
APTOS_PRIVATE_KEY=0x...        # from .aptos/config.yaml
APTOS_NODE_API_KEY=...         # from Geomi (testnet)
```

### 5. One-time on-chain setup
```bash
# mint testnet USDC and deposit it as collateral
npx tsx --env-file=.env.local src/scripts/setup-usdc.ts

# approve the builder fee cap for my own builder subaccount
npx tsx --env-file=.env.local src/scripts/approve-builder.ts
```

### 6. Run
```bash
npm run dev
```
Open http://localhost:3000.

---

## Demo path (what to run first)

1. Home loads the dashboard (equity, available, PnL, positions, orders).
2. Press **Buy** with a small size (e.g. 0.001) → order executes, position appears.
3. Publish a signal (side, TP%, SL%, hours) → entry is captured from the live price.
4. See the signal card with its entry / TP / SL chart.
5. Press **Copy** on a signal → the equivalent order is placed from your account.

---

## Safety note (biggest risk + mitigation)

The biggest risk in this submission is **leaking the signing key**. Mitigation: the Write SDK and `PRIVATE_KEY` are strictly server-side — `decibel.ts` starts with `import "server-only"`, the key lives only in a gitignored `.env.local`, and all signing happens inside API routes, so the key is never bundled to the client. Secondary controls: the **`builderFee <= maxFee` lock** is checked server-side before every order (I keep `builderFee == maxFee`), input is validated before anything is signed, and the app is **testnet-only** (`TESTNET_CONFIG`, no mainnet path anywhere).

---

## Findings & troubleshooting (SDK v0.7.0)

The take-home snippet and the docs are a **map, not gospel** — several things differed from the installed SDK. I verified each against the actual `.d.ts` types and by running it. Key findings:

- **Market name is `BTC/USD` (slash)**, not `BTC-USD` (docs and snippet used a hyphen). Confirmed via `markets.getAll()`.
- **Read methods take an object and use the subaccount:** `read.accountOverview.getByAddr({ subAddr })`, `read.userPositions.getByAddr({ subAddr })`, `read.userOpenOrders.getByAddr({ subAddr })` — not `getByAddr(addrString)` / `getBySubaccount`. Passing a string sent `undefined` and produced a confusing 404 ("Account undefined").
- **`marketPrices.getByName({ marketName })` returns an ARRAY**, even for one market — took `[0]`.
- **`markets.getByName` does an on-chain `getResource` that 404s** on testnet; used `markets.getAll()` + `find` instead.
- **Gas: `MAX_GAS_UNITS_EXCEEDS_MAX_GAS_UNITS_BOUND`** on writes. Fix: `skipSimulate: true` on the Write SDK. When simulating, the SDK set `max_gas_amount` to the network max, which exceeds the testnet bound. (`GasPriceManager` did not help — that controls gas *price*, not gas *units*.)
- **Order price/size must be CHAIN UNITS (integers)** for the `marketName` `placeOrder` — the readme's `size: 1.5` human example is misleading. Passing a float throws a `BigInt` error. Converted via `value * 10 ** decimals`, rounded to `tick_size` / `lot_size`.
- **Builder codes are a two-part gotcha, and approve ≠ register:**
  - `approveMaxBuilderFee` requires `builderAddr` to be an **existing subaccount** (owner address → `EBUILDER_SUBACCOUNT_NOT_FOUND`).
  - `placeOrder` requires the builder to be **registered** (`EBUILDER_NOT_REGISTERED`).
  - The SDK exposes no `registerBuilder`; the documented example builder address isn't usable for approve on this testnet. I used my **own primary subaccount** as the builder (which exists + is registered), so approve → place works with my own address.
- **Collateral is two steps:** `restricted_mint` mints testnet USDC to the wallet, then `deposit()` moves it into the trading subaccount (mint alone isn't collateral). USDC has 6 decimals.
- **Silent partial fill:** an IOC order for an absurd size reported "executed" but only filled a fraction (margin-limited). Added a **collateral-based size cap** (`available * maxLeverage / price`, with a 5% buffer) that rejects oversized inputs before signing, so a successful response means a full fill.
- **Builder fee unit is ambiguous** (SDK comment "100 = 0.01%" vs docs "10 bps = 0.1%"). I keep `builderFee == maxFee` so the safety lock holds regardless of the exact unit.

---

## Done vs. not done — with another day

Implemented and verified end-to-end. What I'd add next:

- **Automatic TP/SL orders on copy.** Copy currently places the equivalent **entry** only; it doesn't submit on-chain TP/SL trigger orders. I'd wire the signal's TP/SL into `placeOrder`'s trigger-price params.
- **Exact fill reporting.** Report filled vs requested size instead of a generic success (read back fills from `userTradeHistory`).
- **Per-user wallets.** The MVP uses a single hardcoded server key, so every action comes from one account. In production each user would connect their own wallet (Aptos wallet adapter) and approve the builder fee from the UI the first time they trade.
- **Per-position live PnL** in each row (currently the account-level unrealized PnL is shown).
- **WebSocket** instead of polling for live updates.
- **Position netting:** with a single cross-margin account and no `isReduceOnly`, copy orders net against existing positions rather than opening isolated ones.

---

## AI assistance & review

I used AI tooling to generate boilerplate and to work through the SDK, then reviewed and corrected everything by running it. AI-assisted: the Next.js scaffolding, route handlers, React components, and the setup scripts. What I owned and changed after review: all of the **Findings** above were caught by reading the actual SDK types and testing on testnet (the snippet's method names, argument shapes, gas config, chain-unit conversion, and the builder-code approve-vs-register distinction were wrong or incomplete out of the box). I also made the architecture and safety decisions — server-only key handling, the collateral-based size cap, and the `builderFee <= maxFee` lock — and verified each safety check by deliberately breaking it (oversized order, `builderFee > maxFee`, bad inputs) to confirm it fails safely. I'm accountable for every line submitted.