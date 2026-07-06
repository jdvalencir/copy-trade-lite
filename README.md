# Copy-Trade Lite

A dead-simple perpetuals trading app with a copy-trade signals feature, built on **Decibel** (Aptos testnet). Anyone can place a one-click BTC trade, publish a trade idea ("signal"), and copy someone else's signal into their own account with a single button.

> **Testnet only. No real funds anywhere.** All config uses `TESTNET_CONFIG`.

**🔗 Live app:** https://copy-trade-lite.vercel.app/ — open it, place a testnet trade, and publish / copy a signal.

**🎥 Demo video (< 3 min):** https://www.youtube.com/watch?v=hFvUKwIfexU

---

## Screenshots

| Home — trade, account & signals feed | Publish a signal |
| :---: | :---: |
| <img width="440" alt="Home" src="https://github.com/user-attachments/assets/34ab3359-3775-4441-af8a-90d1b91743af" /> | <img width="440" alt="Publish a signal" src="https://github.com/user-attachments/assets/2c8d8adb-89ef-4965-893f-22cdd8d2e50b" /> |

| Signal card — chart, outcome & one-click copy | Author leaderboard |
| :---: | :---: |
| <img width="260" alt="Signal card" src="https://github.com/user-attachments/assets/1a61bb8a-f324-47c6-96b3-1d75675bd533" /> | <img width="440" alt="Author leaderboard" src="https://github.com/user-attachments/assets/75ff2b78-2231-4dcc-ab69-b917e9a17a92" /> |

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
- [x] **Signal outcome from real price history:** each signal is marked **Hit TP / Hit SL / Expired / Active** by replaying the market **candlesticks** over its hold window (first level crossed wins). Falls back to a time-based status if candles can't be read — never fabricates a hit.
- [x] **Author leaderboard with win rate** (wins/losses = TP/SL hits) — a real per-author track record.
- [x] Signal filters (Active / Closed / All) and a home feed that **polls** for new signals and updated outcomes (no refresh needed).
- [x] Live (not historical) price-vs-plan indicator per active signal (past TP / past SL / in range).
- [x] Closed signals (hit TP/SL or expired) stay in history but can't be copied.
- [x] Light/dark theme toggle.

**Extra safety hardening**
- [x] Input validation before signing (positive/finite size, valid side, collateral-based size cap).
- [x] `builderFee <= maxFee` lock enforced server-side.
- [x] Private key never leaves the server (`import "server-only"`).

---

## Stack

- **Next.js (App Router) + TypeScript + Tailwind**
- **UI:** shadcn/ui (Radix) + Tailwind v4, Recharts (charts), next-themes (dark mode), sonner (toasts)
- `@decibeltrade/sdk` **v0.7.0** and `@aptos-labs/ts-sdk`
- Aptos testnet via a **Geomi** Node API key
- Signal persistence: local **JSON file** (`data/signals.json`) in dev, **Redis** (`node-redis`) when deployed — auto-selected via `REDIS_URL`

---

## Architecture

```
src/
  lib/
    decibel.ts        # server-only core: read/write SDK clients, account, addresses, builder constants
    signals.ts        # server-only signal persistence (JSON) + validation
    useLivePrice.ts   # client: ONE shared poller for the live BTC price (pub/sub, so N cards = 1 fetch)
    utils.ts          # cn (classnames), requireEnv, fmt ($ format)
  app/
    api/
      account/route.ts   # GET  – dashboard reads (overview, positions, open orders) + mark price
      trade/route.ts     # POST – validate + collateral cap, price, chain-unit convert, place order (builder code)
      signals/route.ts   # GET list / POST create (captures live entry price)
      price/route.ts     # GET  – live BTC mark price
    layout.tsx           # theme provider + toaster
    page.tsx             # home: trade panel + dashboard (left), signals feed (right)
    author/page.tsx      # signal authoring page
  components/
    TradePanel.tsx        # manual buy/sell
    Dashboard.tsx         # equity / positions (per-position PnL) / open orders — polls /api/account (4s)
    SignalForm.tsx        # publish a signal
    SignalRecords.tsx     # server: SSR the initial signals -> feed
    SignalsFeed.tsx       # client: polls /api/signals (5s); renders leaderboard + list
    SignalLeaderboard.tsx # per-author track record
    SignalsList.tsx       # Active / Expired / All filters + grid
    SignalRecord.tsx      # one signal: chart, status, live indicator, Copy button
    SignalChart.tsx       # Recharts: price line + entry/TP/SL reference lines
    ModeToggle.tsx        # light/dark theme toggle
    theme-provider.tsx    # next-themes wrapper
    ui/                   # shadcn/ui primitives (button, card, input, ...)
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

## Deploy (Vercel)

The app is deploy-ready. The only thing that can't run on serverless is the JSON
file store (Vercel's filesystem is read-only), so signal persistence swaps to
**Redis** automatically when `REDIS_URL` is set — locally it stays on the JSON
file with no config.

1. Push to GitHub and import the repo in Vercel.
2. Create a **Redis** database (Vercel dashboard → Storage → create a Redis DB, or
   any hosted Redis) and **Connect it to the project** — that injects a `REDIS_URL`
   env var (Production + Preview).
3. Add the trading env vars in Vercel project settings: `APTOS_PRIVATE_KEY`,
   `APTOS_NODE_API_KEY`.
4. Run the one-time on-chain setup **locally** (mint/deposit + approve builder) —
   those scripts sign from your machine, not the deployment.
5. Redeploy. `listSignals` / `addSignal` use Redis (via `node-redis`) automatically
   when `REDIS_URL` exists.

> **Note:** the deployed app trades from a single hardcoded testnet key, so every
> visitor's action comes from **one** account. That's fine for a testnet demo, but
> a real deployment would use per-user wallets (see "Done vs not done"). No mainnet
> path exists anywhere.

---

## Demo path (what to run first)

1. Home loads: trade panel + dashboard (equity, available, PnL, positions with live PnL, open orders) on the left, signals feed on the right.
2. Press **Buy** with a small size (e.g. 0.001) → order executes (builder code attached), the position appears.
3. Click **Publish a signal** (top of the signals column) → opens `/author`. Fill side, TP%, SL%, hours, size and publish — the entry is captured from the live price server-side. It does **not** redirect; use **← Back** to return.
4. Back on the home, the new signal shows up in the feed on its own within a few seconds (the feed **polls**; default **Active** filter), with its entry / TP / SL chart and a live indicator.
5. Press **Copy** on a signal → the equivalent order is placed from your account (builder code attached).

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
  - **Bug I shipped, then caught & fixed:** the app first had the builder code effectively **off** — `USE_BUILDER_CODE = false`, so `placeOrder` never attached `builderAddr`/`builderFee` and orders went out *without* a builder code (MUST #2 wasn't really met). Worse, `approve-builder.ts` approved a **hardcoded** address that was different from the one the app derived, so even once enabled the approved `maxFee` wouldn't be authorized for the order's builder. **Fix:** derive the builder address **identically** in the approve script and in the app — the primary subaccount **padded to 64 chars** (`"0x" + hex.padStart(64, "0")`) — turn on the builder code in `placeOrder`, and keep the `builderFee (10) <= maxFee (10)` lock enforced before signing. Now the address I approve is byte-for-byte the address attached to every order, and the approve → place flow actually carries the builder code.
- **Collateral is two steps:** `restricted_mint` mints testnet USDC to the wallet, then `deposit()` moves it into the trading subaccount (mint alone isn't collateral). USDC has 6 decimals.
- **Silent partial fill:** an IOC order for an absurd size reported "executed" but only filled a fraction (margin-limited). Added a **collateral-based size cap** (`available * maxLeverage / price`, with a 5% buffer) that rejects oversized inputs before signing, so a successful response means a full fill.
- **Builder fee unit is ambiguous** (SDK comment "100 = 0.01%" vs docs "10 bps = 0.1%"). I keep `builderFee == maxFee` so the safety lock holds regardless of the exact unit.
- **Signal outcome uses candles, not fills.** The stretch says "read back fills/positions", but the app never places on-chain TP/SL orders, so fills can't tell you whether a *hypothetical* signal hit TP. I use `candlesticks.getByName` and test the window's highs/lows against the TP/SL levels (first crossed wins; on a candle that straddles both, SL wins — conservative). Two caveats I handle defensively: the candle **timestamp unit** (s vs ms) is auto-detected (try ms, retry seconds), and outcome falls back to a time-based status if candles are empty. One honest limitation: candle wicks are intra-minute, so **razor-thin levels (e.g. 0.1%, ~market noise) can register a "hit" the smoothed live-price line never sampled** — realistic TP/SL (2–3%) behave intuitively.

---

## Done vs. not done — with another day

Implemented and verified end-to-end. What I'd add next:

- **Automatic TP/SL orders on copy.** Copy currently places the equivalent **entry** only; it doesn't submit on-chain TP/SL trigger orders. I'd wire the signal's TP/SL into `placeOrder`'s trigger-price params.
- **Exact fill reporting.** Report filled vs requested size instead of a generic success (read back fills from `userTradeHistory`).
- **Per-user wallets.** The MVP uses a single hardcoded server key, so every action comes from one account. In production each user would connect their own wallet (Aptos wallet adapter) and approve the builder fee from the UI the first time they trade.
- **Real-time via WebSocket.** With another day I'd swap the polling (price, account, and the signals feed) for Decibel's WebSocket subscriptions — the SDK exposes the topics (`market_price`, positions/orders by address). I scoped it but kept **polling** for the MVP: the brief accepts polling, and a browser WS subscription authenticates via subprotocol, which would mean exposing the node API key client-side. I'd do it server-side behind a small WS proxy (needs a long-running host, not serverless) or with a dedicated public read-only key.
- **Position netting:** with a single cross-margin account and no `isReduceOnly`, copy orders net against existing positions rather than opening isolated ones.

---

## AI assistance & review

I used AI tooling to generate boilerplate and to work through the SDK, then reviewed and corrected everything by running it. AI-assisted: the Next.js scaffolding, route handlers, React components, the **shadcn/ui + Recharts + next-themes UI layer**, and the setup scripts. What I owned and changed after review: all of the **Findings** above were caught by reading the actual SDK types and testing on testnet (the snippet's method names, argument shapes, gas config, chain-unit conversion, and the builder-code approve-vs-register distinction were wrong or incomplete out of the box). I also **caught a builder-code bug in my own code during review** — it was disabled (`USE_BUILDER_CODE = false`) and the approved builder address didn't match the one attached to orders, so orders were going out without a working builder code (see Findings). I made the architecture and safety decisions — server-only key handling, the collateral-based size cap, and the `builderFee <= maxFee` lock — and verified each safety check by deliberately breaking it (oversized order, `builderFee > maxFee`, bad inputs) to confirm it fails safely. I'm accountable for every line submitted.