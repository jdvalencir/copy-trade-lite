import { Dashboard } from "@/components/Dashboard";
import { SignalForm } from "@/components/SignalForm";
import { SignalRecords } from "@/components/SignalRecords";
import { TradePanel } from "@/components/TradePanel";

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Copy-Trade Lite</h1>
      <TradePanel />
      <Dashboard />
      <SignalForm />
      <section>
        <h2 className="text-lg font-semibold mb-3">Published signals</h2>
        <SignalRecords />
      </section>
    </main>
  );
}
