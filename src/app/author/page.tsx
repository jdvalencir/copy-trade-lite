import { ModeToggle } from "@/components/ModeToggle";
import { SignalForm } from "@/components/SignalForm";

export default function AuthorPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">Publish a signal</h1>
        <div className="shrink-0">
          <ModeToggle />
        </div>
      </div>
      <SignalForm />
    </main>
  );
}
