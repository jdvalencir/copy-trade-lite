import { SignalForm } from "@/components/SignalForm";
import Link from "next/link";

export default function AuthorPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Publish a signal</h1>
        <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Back to app
        </Link>
      </div>
      <SignalForm />
    </main>
  );
}
