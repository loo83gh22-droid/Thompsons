"use client";

import { useRouter } from "next/navigation";

type Member = { id: string; name: string };

export function MemberTabs({
  members,
  selectedMemberId,
  category,
}: {
  members: Member[];
  selectedMemberId: string | null;
  category: string;
}) {
  const router = useRouter();

  if (!members.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => {
        const isSelected = member.id === selectedMemberId;
        return (
          <button
            key={member.id}
            type="button"
            onClick={() =>
              router.push(`/dashboard/favourites/${category}?member=${member.id}`)
            }
            className={`min-h-[36px] rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isSelected
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
            }`}
          >
            {member.name}
          </button>
        );
      })}
    </div>
  );
}
