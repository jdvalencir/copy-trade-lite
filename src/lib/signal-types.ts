import type { Signal } from "./signals";

// Resolved status of a signal, derived from real price history (candles):
//  - "tp"      → price hit the take-profit level within the hold window
//  - "sl"      → price hit the stop-loss level within the hold window
//  - "expired" → hold window elapsed without hitting either
//  - "active"  → still within the hold window, neither level hit yet
export type Outcome = "tp" | "sl" | "expired" | "active";

export type SignalWithOutcome = Signal & { outcome: Outcome };
