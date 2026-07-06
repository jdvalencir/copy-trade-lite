import { Redis } from "@upstash/redis";
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
const REDIS_KEY = "signals";

// Storage backend: use Upstash Redis when its env vars are present (e.g. on
// Vercel, whose filesystem is read-only); otherwise a local JSON file. This
// keeps local dev exactly as it was and makes the app deployable unchanged.
// Accepts either Upstash-native or Vercel-KV-style variable names.
let cachedRedis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  cachedRedis = url && token ? new Redis({ url, token }) : null;
  return cachedRedis;
}

async function readAllFromFile(): Promise<Signal[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as Signal[];
  } catch {
    return []; // if the file doesn't exist yet, empty list
  }
}

async function writeAllToFile(signals: Signal[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(signals, null, 2), "utf-8");
}

export async function listSignals(): Promise<Signal[]> {
  const redis = getRedis();
  const all = redis
    ? (await redis.lrange<Signal>(REDIS_KEY, 0, -1)) ?? []
    : await readAllFromFile();
  return all.sort((a, b) => b.createdAt - a.createdAt); // most recent first
}

export async function addSignal(input: Omit<Signal, "id" | "createdAt">): Promise<Signal> {
  const signal: Signal = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const redis = getRedis();
  if (redis) {
    // Append (list op) avoids the read-modify-write race of the file store.
    await redis.rpush(REDIS_KEY, signal);
  } else {
    const all = await readAllFromFile();
    all.push(signal);
    await writeAllToFile(all);
  }
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