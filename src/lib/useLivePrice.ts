"use client";
import { useEffect, useState } from "react";

// Single shared poller for the live BTC price so N signal cards don't each hit
// /api/price. Subscribers get the latest value every 5s.
let current: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<(p: number) => void>();

async function poll() {
  try {
    const res = await fetch("/api/price");
    const json = await res.json();
    if (res.ok && Number.isFinite(json.price)) {
      current = json.price;
      subscribers.forEach((fn) => fn(json.price));
    }
  } catch {
    /* keep the last known price on failure */
  }
}

export function useLivePrice(): number | null {
  const [price, setPrice] = useState<number | null>(current);

  useEffect(() => {
    const cb = (p: number) => setPrice(p);
    subscribers.add(cb);
    if (current != null) setPrice(current);
    if (!timer) {
      poll();
      timer = setInterval(poll, 5000);
    }
    return () => {
      subscribers.delete(cb);
      if (subscribers.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return price;
}
