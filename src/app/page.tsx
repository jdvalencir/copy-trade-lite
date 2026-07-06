import { Dashboard } from "@/components/Dashboard";
import { ModeToggle } from "@/components/ModeToggle";
import { SignalRecords } from "@/components/SignalRecords";
import { TradePanel } from "@/components/TradePanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 space-y-6 lg:h-screen lg:flex lg:flex-col lg:space-y-0 lg:gap-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">Copy-Trade Lite</h1>
          <p className="text-sm text-muted-foreground">
            Dead-simple copy-trading on Decibel · Aptos testnet
          </p>
        </div>
        <div className="shrink-0">
          <ModeToggle />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[440px_1fr] lg:flex-1 lg:min-h-0 items-start lg:items-stretch">
        {/* Left: trade + account. Scrolls on its own on desktop. */}
        <aside className="space-y-6 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <TradePanel />
          <Dashboard />
        </aside>

        {/* Right: signals feed. Scrolls on its own on desktop. */}
        <section className="flex flex-col gap-3 lg:min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Published signals</h2>
            <Button asChild size="sm">
              <Link href="/author">Publish a signal</Link>
            </Button>
          </div>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            <SignalRecords />
          </div>
        </section>
      </div>
    </main>
  );
}
