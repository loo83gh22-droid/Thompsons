"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "../../components/EmptyState";

type AwardFile = { id: string; url: string; file_type: string; file_name: string | null; sort_order: number };
type AwardMember = { family_member_id: string };

type Award = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  awarded_by: string | null;
  award_date: string | null;
  created_at: string;
  award_files: AwardFile[] | null;
  award_members: AwardMember[] | null;
};

type FamilyMember = { id: string; name: string; nickname: string | null };

const CATEGORY_LABELS: Record<string, string> = {
  sports: "Sports",
  academic: "Academic",
  professional: "Professional",
  community: "Community",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  sports: "bg-green-100 text-green-700",
  academic: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  community: "bg-orange-100 text-orange-700",
  other: "bg-[var(--surface)] text-[var(--muted)]",
};

export function AwardsGallery({
  awards,
  memberId,
  memberName,
  allMembers,
}: {
  awards: Award[];
  memberId: string;
  memberName: string;
  allMembers: FamilyMember[];
}) {
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const memberMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const mem of allMembers) m[mem.id] = mem.nickname || mem.name;
    return m;
  }, [allMembers]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of awards) set.add(a.category);
    return Array.from(set);
  }, [awards]);

  const filtered = useMemo(() => {
    if (filterCategory === "all") return awards;
    return awards.filter((a) => a.category === filterCategory);
  }, [awards, filterCategory]);

  if (awards.length === 0) {
    return (
      <EmptyState
        icon="🏆"
        headline={`No awards yet for ${memberName}`}
        description="Upload a photo of a trophy, scan of a certificate, or an article — and build a record of every achievement."
        actionLabel="+ Add first award"
        actionHref={`/dashboard/awards/${memberId}/new`}
      />
    );
  }

  return (
    <div className="space-y-5">
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filterCategory === "all"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filterCategory === c
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((award) => {
          const files = [...(award.award_files ?? [])].sort((a, b) => a.sort_order - b.sort_order);
          const coverImage = files.find((f) => f.file_type === "image");
          const hasDocOnly = files.length > 0 && !coverImage;

          // Other recipients besides current member
          const otherRecipients = (award.award_members ?? [])
            .map((m) => m.family_member_id)
            .filter((id) => id !== memberId)
            .map((id) => memberMap[id])
            .filter(Boolean);

          return (
            <Link
              key={award.id}
              href={`/dashboard/awards/${memberId}/${award.id}`}
              className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full bg-[var(--surface)]">
                {coverImage ? (
                  <Image
                    src={coverImage.url}
                    alt={award.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1">
                    <span className="text-4xl">{hasDocOnly ? "📄" : "🏆"}</span>
                    {hasDocOnly && (
                      <span className="text-xs text-[var(--muted)]">
                        {files[0]?.file_name ?? "Document"}
                      </span>
                    )}
                  </div>
                )}
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    CATEGORY_COLORS[award.category] ?? CATEGORY_COLORS.other
                  }`}
                >
                  {CATEGORY_LABELS[award.category] ?? award.category}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {award.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                  {award.awarded_by
                    ? `by ${award.awarded_by}`
                    : award.award_date
                    ? new Date(award.award_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                      })
                    : ""}
                </p>
                {otherRecipients.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                    Also: {otherRecipients.join(", ")}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
