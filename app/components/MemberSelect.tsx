"use client";

import { useCallback } from "react";

interface Member {
  id: string;
  name: string;
  color?: string | null;
}

interface MemberSelectProps {
  members: Member[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  hint?: string;
  required?: boolean;
  /** Hidden input name for FormData (will emit one hidden input per selected ID) */
  name?: string;
}

export function MemberSelect({
  members,
  selectedIds,
  onChange,
  label = "Who is this about?",
  hint,
  required = false,
  name = "member_ids",
}: MemberSelectProps) {
  const allSelected = members.length > 0 && selectedIds.length === members.length;

  const toggleMember = useCallback(
    (id: string) => {
      onChange(
        selectedIds.includes(id)
          ? selectedIds.filter((s) => s !== id)
          : [...selectedIds, id]
      );
    },
    [selectedIds, onChange]
  );

  const toggleAll = useCallback(() => {
    onChange(allSelected ? [] : members.map((m) => m.id));
  }, [allSelected, members, onChange]);

  return (
    <div>
      <span className="block text-sm font-medium text-[var(--muted)]">
        {label} {required && "*"}
      </span>
      {hint && (
        <p className="mt-1 text-xs text-[var(--muted)] opacity-70">{hint}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {/* Select All toggle */}
        {members.length > 1 && (
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="rounded"
            />
            Select All
          </label>
        )}
        {members.map((m) => (
          <label
            key={m.id}
            className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/10"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(m.id)}
              onChange={() => toggleMember(m.id)}
              className="rounded"
            />
            {m.color && (
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: m.color }}
              />
            )}
            {m.name}
          </label>
        ))}
      </div>
      {/* Hidden inputs for FormData */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
