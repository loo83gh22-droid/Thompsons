"use client";

import { useState, useTransition } from "react";
import { saveBabyBookProfile, type BabyBookProfile } from "../actions";

type Props = {
  memberId: string;
  memberName: string;
  profile: BabyBookProfile | null;
};

const FIELDS: {
  key: keyof Omit<BabyBookProfile, "id">;
  label: string;
  placeholder: string;
  multiline?: boolean;
}[] = [
  { key: "birth_time",   label: "Time of birth",   placeholder: "e.g. 3:42 AM" },
  { key: "birth_weight", label: "Birth weight",     placeholder: "e.g. 7 lbs 4 oz" },
  { key: "birth_length", label: "Birth length",     placeholder: "e.g. 20 inches" },
  { key: "birth_place",  label: "Born at",          placeholder: "e.g. Sunnybrook Hospital, Toronto" },
  { key: "birth_story",  label: "Birth story",      placeholder: "A few words about the day they arrived…", multiline: true },
];

export function BirthDetailsCard({ memberId, memberName, profile }: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<BabyBookProfile, "id">>({
    birth_time:   profile?.birth_time   ?? "",
    birth_weight: profile?.birth_weight ?? "",
    birth_length: profile?.birth_length ?? "",
    birth_place:  profile?.birth_place  ?? "",
    birth_story:  profile?.birth_story  ?? "",
  });

  const hasAnyData = Object.values(form).some((v) => v && v.trim().length > 0);

  function handleChange(key: keyof Omit<BabyBookProfile, "id">, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveBabyBookProfile(memberId, form);
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
      } else {
        setEditing(false);
      }
    });
  }

  function handleCancel() {
    setForm({
      birth_time:   profile?.birth_time   ?? "",
      birth_weight: profile?.birth_weight ?? "",
      birth_length: profile?.birth_length ?? "",
      birth_place:  profile?.birth_place  ?? "",
      birth_story:  profile?.birth_story  ?? "",
    });
    setEditing(false);
    setError(null);
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-[var(--foreground)]">
          About {memberName}
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {hasAnyData ? "Edit" : "+ Add details"}
          </button>
        )}
      </div>

      {/* View mode */}
      {!editing && hasAnyData && (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.filter((f) => form[f.key]).map((f) => (
            <div key={f.key} className={f.multiline ? "sm:col-span-2" : ""}>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {f.label}
              </dt>
              <dd className={`mt-0.5 text-[var(--foreground)] ${f.multiline ? "text-sm leading-relaxed" : "font-medium"}`}>
                {form[f.key]}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {!editing && !hasAnyData && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Birth time, weight, length, hospital — the details you&apos;ll always want to remember.
        </p>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="mt-4 space-y-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((f) =>
              f.multiline ? (
                <div key={f.key} className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                    {f.label}
                  </label>
                  <textarea
                    rows={3}
                    value={form[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="input-base w-full resize-y"
                  />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={form[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="input-base w-full"
                  />
                </div>
              )
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="min-h-[44px] rounded-full bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="min-h-[44px] rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
