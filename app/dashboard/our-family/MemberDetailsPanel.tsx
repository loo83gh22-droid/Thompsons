"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteFamilyMember } from "../members/actions";
import type { OurFamilyMember } from "./page";
import type { MemberActivity } from "./page";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function memberStatus(m: OurFamilyMember): "signed_in" | "pending_invitation" | "no_account" {
  if (m.user_id) return "signed_in";
  if (m.contact_email?.trim()) return "pending_invitation";
  return "no_account";
}

const STATUS_LABELS: Record<ReturnType<typeof memberStatus>, string> = {
  signed_in: "Signed In",
  pending_invitation: "Pending Invitation",
  no_account: "Not Invited",
};

export function MemberDetailsPanel({
  member,
  activity,
  onClose,
}: {
  member: OurFamilyMember;
  activity?: MemberActivity;
  onClose: () => void;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const status = memberStatus(member);
  const birthdayStr = member.birth_date
    ? new Date(member.birth_date + "T12:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: member.birth_date.slice(0, 4) !== "0000" ? "numeric" : undefined,
      })
    : null;
  const memberSince = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  async function handleRemove() {
    if (!confirm(`Remove ${member.name} from the family? This cannot be undone.`)) return;
    setRemoving(true);
    try {
      await deleteFamilyMember(member.id);
      onClose();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  }

  const act = activity ?? { journalCount: 0, voiceCount: 0, photoCount: 0 };

  return (
    <aside
      className="fixed inset-0 z-50 flex flex-col overflow-hidden rounded-none border-0 bg-[var(--surface)] shadow-xl lg:static lg:inset-auto lg:sticky lg:top-24 lg:h-fit lg:w-[320px] lg:max-w-[320px] lg:overflow-visible lg:rounded-xl lg:border lg:border-[var(--border)]"
      aria-label="Member details"
    >
      <div className="flex items-start justify-between border-b border-[var(--border)] p-4">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Details</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-col items-center text-center">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt=""
              className="h-[120px] w-[120px] rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[var(--accent)]/30 text-3xl font-semibold text-[var(--accent)]">
              {initials(member.name)}
            </div>
          )}
          <h3 className="mt-3 font-display text-xl font-bold text-[var(--foreground)]">{member.name}</h3>
          {member.nickname?.trim() && (
            <p className="text-[var(--muted)]">&quot;{member.nickname}&quot;</p>
          )}
          {member.relationship && (
            <span className="mt-1 inline-block rounded-full bg-[var(--accent)]/20 px-3 py-1 text-sm font-medium text-[var(--accent)]">
              {member.relationship}
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {birthdayStr && (
            <p className="text-[var(--muted)]">
              <span className="font-medium text-[var(--foreground)]">Birthday:</span> {birthdayStr}
            </p>
          )}
          {member.contact_email?.trim() && (
            <p className="truncate text-[var(--muted)]">
              <span className="font-medium text-[var(--foreground)]">Email:</span> {member.contact_email}
            </p>
          )}
          <p className="text-[var(--muted)]">
            <span className="font-medium text-[var(--foreground)]">Status:</span> {STATUS_LABELS[status]}
          </p>
          {memberSince && (
            <p className="text-[var(--muted)]">
              <span className="font-medium text-[var(--foreground)]">Member since:</span> {memberSince}
            </p>
          )}
        </div>

        {(act.journalCount > 0 || act.voiceCount > 0 || act.photoCount > 0) && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Recent activity
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
              {act.photoCount > 0 && <li>Uploaded {act.photoCount} photo{act.photoCount !== 1 ? "s" : ""}</li>}
              {act.journalCount > 0 && <li>Wrote {act.journalCount} journal {act.journalCount !== 1 ? "entries" : "entry"}</li>}
              {act.voiceCount > 0 && <li>Recorded {act.voiceCount} voice memo{act.voiceCount !== 1 ? "s" : ""}</li>}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
          <Link
            href={`/dashboard/members/${member.id}`}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-center text-sm font-medium hover:bg-[var(--surface-hover)]"
          >
            Edit Profile
          </Link>
          <Link
            href="/dashboard/messages"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-center text-sm font-medium hover:bg-[var(--surface-hover)]"
          >
            Send Message
          </Link>
          {status === "pending_invitation" && (
            <Link
              href={`/dashboard/members/${member.id}`}
              className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-center text-sm font-medium text-amber-400 hover:bg-amber-500/20"
            >
              Resend Invitation
            </Link>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove Member"}
          </button>
        </div>
      </div>
    </aside>
  );
}
