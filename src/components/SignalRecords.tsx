import { listSignals, Signal } from "@/lib/signals";
import { SignalRecord } from "./SignalRecord";

export async function SignalRecords() {
  const signals: Signal[] = await listSignals();

  if (signals.length === 0) {
    return <p className="text-gray-500">No signals yet. Publish the first one above.</p>;
  }

  return (
    <div>
      {signals.map((signal) => (
        <SignalRecord key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
