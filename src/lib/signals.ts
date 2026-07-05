import { promises as fs } from "fs";
import path from "path";
import "server-only";

export type Signal = {
  id: string;
  author: string;
  market: string;
  side: "buy" | "sell";
  entry: number;       // price frozen at creation
  tpPercent: number;   // e.g. 3 = +3%
  slPercent: number;   // e.g. 2 = -2%
  holdHours: number;
  size: number;
  createdAt: number;    // Date.now()
};

const FILE = path.join(process.cwd(), "data", "signals.json");

async function readAll(): Promise<Signal[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as Signal[];
  } catch {
    return []; // if the file doesn't exist yet, empty list
  }
}

async function writeAll(signals: Signal[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(signals, null, 2), "utf-8");
}

export async function listSignals(): Promise<Signal[]> {
  const all = await readAll();
  return all.sort((a, b) => b.createdAt - a.createdAt); // most recent first
}

export async function addSignal(input: Omit<Signal, "id" | "createdAt">): Promise<Signal> {
  const all = await readAll();
  const signal: Signal = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  all.push(signal);
  await writeAll(all);
  return signal;
}


export function validateSignalInput(body: any): string | null {
  if (!body) return "Empty body.";
  if (body.side !== "buy" && body.side !== "sell") return "Invalid side.";
  const nums = { entry: body.entry, tpPercent: body.tpPercent, slPercent: body.slPercent, holdHours: body.holdHours, size: body.size };
  for (const [k, v] of Object.entries(nums)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return `Invalid field: ${k}.`;
  }
  return null; // null = all good
}