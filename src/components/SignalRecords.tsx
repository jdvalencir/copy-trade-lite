import { listSignals, Signal } from "@/lib/signals";
import { SignalsFeed } from "./SignalsFeed";

export async function SignalRecords() {
  const signals: Signal[] = await listSignals();
  return <SignalsFeed initialSignals={signals} />;
}
