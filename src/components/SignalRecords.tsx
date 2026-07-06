import { enrichWithOutcomes } from "@/lib/outcomes";
import { listSignals } from "@/lib/signals";
import { SignalsFeed } from "./SignalsFeed";

export async function SignalRecords() {
  const signals = await enrichWithOutcomes(await listSignals());
  return <SignalsFeed initialSignals={signals} />;
}
