import { promises as fs } from "fs";
import path from "path";
import { createClient } from "redis";
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

// Storage backend: use Redis when REDIS_URL is set (e.g. on Vercel, whose
// filesystem is read-only); otherwise a local JSON file. This keeps local dev
// exactly as it was and makes the app deployable unchanged. The connected
// client is cached at module level so it's reused across serverless invocations.
type RedisClient = ReturnType<typeof createClient>;
let clientPromise: Promise<RedisClient> | null = null;
function getRedis(): Promise<RedisClient> | null {
  if (!process.env.REDIS_URL) return null;
  if (!clientPromise) {
    const client: RedisClient = createClient({ url: process.env.REDIS_URL });
    client.on("error", (e) => console.error("Redis client error:", e));
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
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
  const redis = await getRedis();
  const all = redis
    ? (await redis.lRange(REDIS_KEY, 0, -1)).map((s) => JSON.parse(s) as Signal)
    : await readAllFromFile();
  return all.sort((a, b) => b.createdAt - a.createdAt); // most recent first
}

export async function addSignal(input: Omit<Signal, "id" | "createdAt">): Promise<Signal> {
  const signal: Signal = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const redis = await getRedis();
  if (redis) {
    // Append (list op) avoids the read-modify-write race of the file store.
    await redis.rPush(REDIS_KEY, JSON.stringify(signal));
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