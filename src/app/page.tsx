import { Dashboard } from "@/components/Dashboard";
import { SignalRecords } from "@/components/SignalRecords";
import { TradePanel } from "@/components/TradePanel";
import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Copy-Trade Lite</h1>
      <TradePanel />
      <Dashboard />
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Published signals</h2>
          <Link href="/author" className="text-sm font-semibold text-blue-600 hover:underline">
            Publish a signal →
          </Link>
        </div>
        <SignalRecords />
      </section>
    </main>
  );
}
