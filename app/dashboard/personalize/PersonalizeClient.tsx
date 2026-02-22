"use client";

import { useState, useTransition } from "react";
import { saveMyAliases } from "./actions";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name: string;
  nickname: string | null;
  relationship: string | null;
  avatar_url: string | null;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PersonalizeClient({
  members,
  aliasMap,
}: {
  members: Member[];
  aliasMap: Record<string, string>;
}) {
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((m) => [m.id, aliasMap[m.id] ?? ""]))
  );
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      await saveMyAliases(
        members.map((m) => ({ targetMemberId: m.id, label: labels[m.id] ?? "" }))
      );
      setDone(true);
      setTimeout(() => router.push("/dashboard/our-family"), 1800);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="text-6xl">🏡</div>
        <h2 className="mt-6 font-display text-2xl font-bold text-[var(--foreground)]">
          Your Nest is personal now
        </h2>
        <p className="mt-2 text-[var(--muted)]">Taking you back to your family…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl pb-16">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
          One-time setup · only you see this
        </p>
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          What do you call everyone?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Your spouse might call your dad &ldquo;John&rdquo;, but you call him &ldquo;Dad&rdquo;.
          Set the names <em>you</em> use — only you&apos;ll ever see these.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="text-[var(--muted)]">No other family members yet.</p>
          <a
            href="/dashboard/our-family"
            className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline"
          >
            Add family members first →
          </a>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border)]/60 bg-[var(--card)] px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Avatar */}
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-[var(--accent)]/20"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/15 text-sm font-bold text-[var(--primary)]">
                    {initials(m.name)}
                  </div>
                )}

                {/* Name + relationship hint */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {m.name}
                  </p>
                  {m.relationship && (
                    <p className="text-xs text-[var(--muted)]">{m.relationship}</p>
                  )}
                </div>

                {/* Input */}
                <input
                  type="text"
                  value={labels[m.id] ?? ""}
                  onChange={(e) =>
                    setLabels((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  placeholder={m.nickname ?? "What you call them"}
                  className="input-base w-36 shrink-0 text-center text-sm"
                  maxLength={30}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">Only visible to you</p>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full bg-[var(--primary)] px-8 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save my names →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
