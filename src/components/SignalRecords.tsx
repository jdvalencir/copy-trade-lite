import { listSignals, Signal } from "@/lib/signals";
import { SignalRecord } from "./SignalRecord";

export async function SignalRecords() {
  const signals: Signal[] = await listSignals();

  if (signals.length === 0) {
    return <p className="text-muted-foreground text-sm">No signals yet. Publish the first one.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {signals.map((signal) => (
        <SignalRecord key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
