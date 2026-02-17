"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { deleteFamilyMember, changeMemberRole, generateKidLink, revokeKidLink } from "../members/actions";
import { setMemberRelationships } from "./actions";
import type { OurFamilyMember } from "./page";
import type { OurFamilyRelationship } from "./page";
import type { MemberActivity } from "./page";
import { ROLE_LABELS, ROLE_BADGES, type MemberRole } from "@/src/lib/roles";

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
  signed_in: "Active in the app",
  pending_invitation: "Invite sent — waiting to join",
  no_account: "Not yet joined",
};

const STATUS_COLOURS: Record<ReturnType<typeof memberStatus>, string> = {
  signed_in: "text-emerald-600",
  pending_invitation: "text-amber-600",
  no_account: "text-[var(--muted)]",
};

function useMemberTreeRels(memberId: string, relationships: OurFamilyRelationship[]) {
  return useMemo(() => {
    let spouseId: string | null = null;
    const parentIds: string[] = [];
    const childIds: string[] = [];
    for (const r of relationships) {
      if (r.relationship_type === "spouse") {
        if (r.member_id === memberId) spouseId = r.related_id;
        else if (r.related_id === memberId) spouseId = r.member_id;
      } else if (r.relationship_type === "child") {
        if (r.member_id === memberId) parentIds.push(r.related_id);
        else if (r.related_id === memberId) childIds.push(r.member_id);
      }
    }
    return { spouseId, parentIds, childIds };
  }, [memberId, relationships]);
}

export function MemberDetailsPanel({
  member,
  members,
  relationships,
  activity,
  onClose,
}: {
  member: OurFamilyMember;
  members: OurFamilyMember[];
  relationships: OurFamilyRelationship[];
  activity?: MemberActivity;
  onClose: () => void;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [savingRels, setSavingRels] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [kidLinkLoading, setKidLinkLoading] = useState(false);
  const [kidLinkUrl, setKidLinkUrl] = useState<string | null>(null);
  const current = useMemberTreeRels(member.id, relationships);
  const [spouseId, setSpouseId] = useState<string>(current.spouseId ?? "");
  const [parentIds, setParentIds] = useState<string[]>(current.parentIds);
  const [childIds, setChildIds] = useState<string[]>(current.childIds);
  useEffect(() => {
    setSpouseId(current.spouseId ?? "");
    setParentIds(current.parentIds);
    setChildIds(current.childIds);
  }, [member.id, current.spouseId, current.parentIds, current.childIds]);
  const status = memberStatus(member);
  const others = members.filter((m) => m.id !== member.id);
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

  async function handleSaveRelationships() {
    setSavingRels(true);
    const err = await setMemberRelationships(member.id, {
      spouseId: spouseId || null,
      parentIds,
      childIds,
    });
    setSavingRels(false);
    if (err.error) {
      alert(err.error);
      return;
    }
    router.refresh();
  }

  function toggleParent(id: string) {
    setParentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleChild(id: string) {
    setChildIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

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
          {/* Avatar ring colour mirrors list/tree views */}
          <div className={`relative rounded-full ${
            status === "signed_in"
              ? "ring-2 ring-emerald-400 shadow-emerald-400/25 shadow-lg"
              : status === "pending_invitation"
                ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[var(--surface)]"
                : "ring-1 ring-[var(--border)]"
          }`}>
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                loading="lazy"
                className="h-[120px] w-[120px] rounded-full object-cover"
              />
            ) : (
              <div className={`flex h-[120px] w-[120px] items-center justify-center rounded-full text-3xl font-semibold ${
                status === "signed_in"
                  ? "bg-emerald-500/20 text-emerald-600"
                  : status === "pending_invitation"
                    ? "bg-amber-400/20 text-amber-600"
                    : "bg-[var(--accent)]/30 text-[var(--accent)]"
              }`}>
                {initials(member.name)}
              </div>
            )}
            {status === "signed_in" && (
              <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-[var(--surface)] bg-emerald-500 animate-pulse" aria-hidden />
            )}
            {status === "pending_invitation" && (
              <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-[var(--surface)] bg-amber-400" aria-hidden />
            )}
          </div>
          <h3 className="mt-3 font-display text-xl font-bold text-[var(--foreground)]">{member.name}</h3>
          {member.nickname?.trim() && (
            <p className="text-[var(--muted)]">&quot;{member.nickname}&quot;</p>
          )}
          {member.relationship && (
            <span className="mt-1 inline-block rounded-full bg-[var(--accent)]/20 px-3 py-1 text-sm font-medium text-[var(--accent)]">
              {member.relationship}
            </span>
          )}
          {member.role && (
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGES[member.role as MemberRole]?.bg || "bg-[var(--surface-hover)]"} ${ROLE_BADGES[member.role as MemberRole]?.text || "text-[var(--muted)]"}`}>
              {ROLE_LABELS[member.role as MemberRole] || member.role}
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
            <span className="font-medium text-[var(--foreground)]">Status: </span>
            <span className={`font-medium ${STATUS_COLOURS[status]}`}>
              {status === "signed_in" && <span aria-hidden>✓ </span>}
              {status === "pending_invitation" && <span aria-hidden>✉ </span>}
              {STATUS_LABELS[status]}
            </span>
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

        <div className="border-t border-[var(--border)] pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Tree relationships
          </h4>
          <p className="mt-1 text-xs text-[var(--muted)]">Who is this person&apos;s spouse, parents, or children?</p>
          <div className="mt-3 space-y-2">
            <label className="block text-sm text-[var(--foreground)]">
              Spouse
              <select
                value={spouseId}
                onChange={(e) => setSpouseId(e.target.value)}
                className="input-base mt-1 w-full py-1.5 text-sm"
              >
                <option value="">None</option>
                {others.map((m) => (
                  <option key={m.id} value={m.id}>{m.nickname?.trim() || m.name}</option>
                ))}
              </select>
            </label>
            <div className="text-sm text-[var(--foreground)]">
              Parents (this person is child of)
              <div className="mt-1 flex flex-wrap gap-1">
                {others.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleParent(m.id)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${parentIds.includes(m.id) ? "bg-[var(--accent)]/30 text-[var(--accent)]" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}
                  >
                    {m.nickname?.trim() || m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-[var(--foreground)]">
              Children (this person is parent of)
              <div className="mt-1 flex flex-wrap gap-1">
                {others.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleChild(m.id)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${childIds.includes(m.id) ? "bg-[var(--accent)]/30 text-[var(--accent)]" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}
                  >
                    {m.nickname?.trim() || m.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveRelationships}
              disabled={savingRels}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] py-2 text-sm font-medium disabled:opacity-50"
            >
              {savingRels ? "Saving…" : "Save relationships"}
            </button>
          </div>
        </div>

        {/* Role management (owner only, non-owner targets) */}
        {member.role !== "owner" && (
          <div className="border-t border-[var(--border)] pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Access Level
            </h4>
            <select
              value={member.role}
              onChange={async (e) => {
                const newRole = e.target.value as MemberRole;
                if (newRole === member.role) return;
                setChangingRole(true);
                try {
                  await changeMemberRole(member.id, newRole);
                  router.refresh();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to change role");
                } finally {
                  setChangingRole(false);
                }
              }}
              disabled={changingRole}
              className="input-base mt-2 w-full py-1.5 text-sm disabled:opacity-50"
            >
              <option value="adult">Adult — Full access</option>
              <option value="teen">Teen — Own content only</option>
              <option value="child">Child — No login, adults post for them</option>
            </select>
            {changingRole && (
              <p className="mt-1 text-xs text-[var(--muted)]">Updating...</p>
            )}
          </div>
        )}

        {/* Kid link (for child/teen members) */}
        {(member.role === "child" || member.role === "teen") && (
          <div className="border-t border-[var(--border)] pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Kid Link
            </h4>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Generate a shareable link so {member.nickname?.trim() || member.name} can view their content without logging in.
            </p>
            {member.kid_access_token ? (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/kid/${member.kid_access_token}`;
                      navigator.clipboard.writeText(url);
                      setKidLinkUrl(url);
                      setTimeout(() => setKidLinkUrl(null), 3000);
                    }}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 text-xs font-medium hover:bg-[var(--border)]"
                  >
                    {kidLinkUrl ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setKidLinkLoading(true);
                      try {
                        await revokeKidLink(member.id);
                        router.refresh();
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Failed to revoke link");
                      } finally {
                        setKidLinkLoading(false);
                      }
                    }}
                    disabled={kidLinkLoading}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </div>
                <p className="text-xs text-emerald-700">Active link — expires in 30 days</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  setKidLinkLoading(true);
                  try {
                    await generateKidLink(member.id);
                    router.refresh();
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Failed to generate link");
                  } finally {
                    setKidLinkLoading(false);
                  }
                }}
                disabled={kidLinkLoading}
                className="mt-2 w-full rounded-lg border border-purple-500/50 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
              >
                {kidLinkLoading ? "Generating..." : "Generate Kid Link"}
              </button>
            )}
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
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              Resend Invitation
            </Link>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove Member"}
          </button>
        </div>
      </div>
    </aside>
  );
}
