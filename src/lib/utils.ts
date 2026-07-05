export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Missing ${name} in .env.local`);
  return v;
}

export function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}