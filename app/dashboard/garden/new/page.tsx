import type { Metadata } from "next";
import Link from "next/link";
import { NewGardenForm } from "./NewGardenForm";

export const metadata: Metadata = { title: "Add Garden Season | Family Nest" };

export default function NewGardenPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard/garden" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Family Garden
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">Add a garden season</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Document what you grew and what brought joy.</p>
      <NewGardenForm />
    </div>
  );
}
