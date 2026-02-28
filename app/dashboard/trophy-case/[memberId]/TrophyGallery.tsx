"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "../../components/EmptyState";

type TrophyFile = { id: string; url: string; file_type: string; file_name: string | null; sort_order: number };
type TrophyMember = { family_member_id: string };

type Trophy = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  awarded_by: string | null;
  award_date: string | null;
  created_at: string;
  award_files: TrophyFile[] | null;
  award_members: TrophyMember[] | null;
};

type FamilyMember = { id: string; name: string; nickname: string | null };

const CATEGORY_LABELS: Record<string, string> = {
  sports: "Sports",
  academic: "Academic",
  professional: "Professional",
  community: "Community",
  achievement: "Achievement",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  sports: "bg-green-100 text-green-700",
  academic: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  community: "bg-orange-100 text-orange-700",
  achievement: "bg-yellow-100 text-yellow-700",
  other: "bg-[var(--surface)] text-[var(--muted)]",
};

export function TrophyGallery({
  trophies,
  memberId,
  memberName,
  allMembers,
}: {
  trophies: Trophy[];
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
    for (const t of trophies) set.add(t.category);
    return Array.from(set);
  }, [trophies]);

  const filtered = useMemo(() => {
    if (filterCategory === "all") return trophies;
    return trophies.filter((t) => t.category === filterCategory);
  }, [trophies, filterCategory]);

  if (trophies.length === 0) {
    return (
      <EmptyState
        icon="🏆"
        headline={`No trophies yet for ${memberName}`}
        description="Upload a photo of a trophy, scan of a certificate, or an article — and build a record of every achievement."
        actionLabel="+ Add first trophy"
        actionHref={`/dashboard/trophy-case/${memberId}/new`}
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
        {filtered.map((trophy) => {
          const files = [...(trophy.award_files ?? [])].sort((a, b) => a.sort_order - b.sort_order);
          const coverImage = files.find((f) => f.file_type === "image");
          const hasDocOnly = files.length > 0 && !coverImage;

          const otherRecipients = (trophy.award_members ?? [])
            .map((m) => m.family_member_id)
            .filter((id) => id !== memberId)
            .map((id) => memberMap[id])
            .filter(Boolean);

          return (
            <Link
              key={trophy.id}
              href={`/dashboard/trophy-case/${memberId}/${trophy.id}`}
              className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full bg-[var(--surface)]">
                {coverImage ? (
                  <Image
                    src={coverImage.url}
                    alt={trophy.title}
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
                    CATEGORY_COLORS[trophy.category] ?? CATEGORY_COLORS.other
                  }`}
                >
                  {CATEGORY_LABELS[trophy.category] ?? trophy.category}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {trophy.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                  {trophy.awarded_by
                    ? `by ${trophy.awarded_by}`
                    : trophy.award_date
                    ? new Date(trophy.award_date).toLocaleDateString(undefined, {
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
