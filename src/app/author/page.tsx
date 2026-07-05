import { ModeToggle } from "@/components/ModeToggle";
import { SignalForm } from "@/components/SignalForm";

export default function AuthorPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Publish a signal</h1>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
      <SignalForm />
    </main>
  );
}
