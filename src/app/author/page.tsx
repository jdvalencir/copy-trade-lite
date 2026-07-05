import { ModeToggle } from "@/components/ModeToggle";
import { SignalForm } from "@/components/SignalForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthorPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Publish a signal</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">← Back to app</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
      <SignalForm />
    </main>
  );
}
