"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upsertResume } from "../actions";

export function ResumeEditor({
  familyMemberId,
  initialContent,
}: {
  familyMemberId: string;
  initialContent: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await upsertResume(familyMemberId, content);
      setMessage({ type: "success", text: "Resume saved." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        placeholder="Experience, education, skills, certifications...&#10;&#10;Example:&#10;Senior Developer at Acme Corp (2020–present)&#10;BSc Computer Science, University of X (2016)&#10;..."
      />
      {message && (
        <div
          className={`mt-4 rounded-lg px-4 py-2 text-sm ${
            message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <Link
          href="/dashboard/achievements"
          className="rounded-lg border border-[var(--border)] px-6 py-2 font-medium hover:bg-[var(--surface-hover)]"
        >
          Done
        </Link>
      </div>
    </form>
  );
}
