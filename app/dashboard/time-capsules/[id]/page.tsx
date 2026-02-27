import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { notFound, redirect } from "next/navigation";
import { formatDateOnly } from "@/src/lib/date";
import { DeleteTimeCapsuleButton } from "../DeleteTimeCapsuleButton";
import { WaxSeal, nameToInitials } from "../WaxSeal";

export default async function TimeCapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId || !user) return null;

  // Get current user's family member record
  const { data: myMember } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!myMember) return null;

  // Fetch metadata first (no content) to determine access
  const { data: meta } = await supabase
    .from("time_capsules")
    .select(`
      id,
      title,
      unlock_date,
      unlock_on_passing,
      from_family_member_id,
      to_family_member_id,
      from_family_member:family_members!from_family_member_id(name),
      to_family_member:family_members!to_family_member_id(name)
    `)
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!meta) notFound();

  // Check if current user is a recipient (via junction table or legacy FK)
  const { data: junctionMembers } = await supabase
    .from("time_capsule_members")
    .select("family_member_id")
    .eq("time_capsule_id", id);

  const recipientIds = (junctionMembers ?? []).map((r) => r.family_member_id);

  const isSender = meta.from_family_member_id === myMember.id;
  const isLegacyRecipient = meta.to_family_member_id === myMember.id;
  const isJunctionRecipient = recipientIds.includes(myMember.id);
  const isRecipient = isLegacyRecipient || isJunctionRecipient;
  const isOwnerOrAdult = myMember.role === "owner" || myMember.role === "adult";

  // Only sender and recipients can view the full capsule
  // Owners/adults can see it exists but NOT the content (privacy)
  if (!isSender && !isRecipient && !isOwnerOrAdult) {
    redirect("/dashboard/time-capsules");
  }

  // Check if sender has passed (for unlock_on_passing capsules)
  let senderPassed = false;
  if (meta.unlock_on_passing && meta.from_family_member_id) {
    const { data: sender } = await supabase
      .from("family_members")
      .select("is_remembered, passed_date")
      .eq("id", meta.from_family_member_id)
      .single();
    senderPassed = sender?.is_remembered === true;
  }

  const today = new Date().toISOString().slice(0, 10);
  const dateUnlocked = meta.unlock_date <= today;
  const passingUnlocked = meta.unlock_on_passing && senderPassed;
  const unlocked = dateUnlocked || passingUnlocked;

  // Privacy: only sender + recipients can see content. Others see metadata only.
  const canSeeContent = isSender || isRecipient;

  // Only fetch content if unlocked AND user is authorized
  let content: string | null = null;
  if (unlocked && canSeeContent) {
    const { data: full } = await supabase
      .from("time_capsules")
      .select("content")
      .eq("id", id)
      .single();
    content = full?.content ?? null;
  }

  // Build a combined letter object for rendering
  const letter = { ...meta, content };

  const rawFrom = letter.from_family_member as { name: string } | { name: string }[] | null;
  const rawTo = letter.to_family_member as { name: string } | { name: string }[] | null;
  const from = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  const to = Array.isArray(rawTo) ? rawTo[0] : rawTo;

  // Get all recipient names from junction table
  let recipientNames: string[] = [];
  if (recipientIds.length > 0) {
    const { data: members } = await supabase
      .from("family_members")
      .select("name")
      .in("id", recipientIds);
    recipientNames = (members ?? []).map((m) => m.name);
  }
  // Fallback to legacy single recipient
  if (recipientNames.length === 0 && to?.name) {
    recipientNames = [to.name];
  }

  return (
    <div>
      <Link
        href="/dashboard/time-capsules"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to Time Capsules
      </Link>

      <div className="mt-8">
        {unlocked && canSeeContent ? (
          /* ── Opened letter ── */
          <div className="overflow-hidden rounded-2xl border border-amber-200/60 shadow-md">
            {/* Letter header bar */}
            <div
              className="flex items-center justify-between gap-4 border-b border-amber-200/60 px-6 py-4"
              style={{ background: "linear-gradient(105deg, #fdf6e3 0%, #f5e8cc 100%)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">💌</span>
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-bold text-[var(--foreground)] leading-tight">
                    {letter.title}
                  </h1>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    {from?.name && `From ${from.name}`}
                    {recipientNames.length > 0 && from?.name && " · "}
                    {recipientNames.length > 0 && `For ${recipientNames.join(", ")}`}
                    {letter.unlock_date && ` · Unlocked ${formatDateOnly(letter.unlock_date)}`}
                    {passingUnlocked && !dateUnlocked && " · Unlocked in their memory"}
                  </p>
                </div>
              </div>
              {isSender && <DeleteTimeCapsuleButton id={letter.id} />}
            </div>

            {/* Letter body — parchment paper feel */}
            <div
              className="px-8 py-8 md:px-12"
              style={{ background: "linear-gradient(180deg, #fffdf5 0%, #fdf8ec 100%)" }}
            >
              <div
                className="whitespace-pre-wrap leading-relaxed text-[var(--foreground)]"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.0625rem",
                  lineHeight: "1.85",
                  maxWidth: "68ch",
                }}
              >
                {letter.content}
              </div>
            </div>
          </div>
        ) : unlocked && !canSeeContent ? (
          /* ── Private — owner/adult can see it exists but not read it ── */
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex flex-col items-center py-16 text-center px-6">
              <span className="text-5xl">🔐</span>
              <h1 className="mt-6 font-display text-2xl font-bold text-[var(--foreground)]">
                {letter.title}
              </h1>
              <p className="mt-2 text-[var(--muted)]">
                This letter is private — only {recipientNames.length > 0 ? recipientNames.join(" and ") : "the recipient"} can read it.
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {from?.name && `From ${from.name}`}
                {recipientNames.length > 0 && ` · For ${recipientNames.join(", ")}`}
              </p>
            </div>
          </div>
        ) : (
          /* ── Sealed — not yet unlocked ── */
          <div
            className="overflow-hidden rounded-2xl border border-amber-200/70 shadow-md"
            style={{ background: "linear-gradient(160deg, #fdf6e3 0%, #f0e4c8 100%)" }}
          >
            <div className="flex flex-col items-center px-6 py-14 text-center">
              {/* Large envelope with wax seal */}
              <div className="relative inline-block">
                <svg width="140" height="104" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="2" y="2" width="116" height="86" rx="6" fill="#fef9ee" stroke="#c49a4a" strokeWidth="2" />
                  <path d="M2 8L60 54L118 8" stroke="#c49a4a" strokeWidth="2" strokeLinecap="round" />
                  <path d="M2 88L40 56" stroke="#c49a4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                  <path d="M118 88L80 56" stroke="#c49a4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                </svg>
                {/* Wax seal centred on the envelope */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3">
                  <WaxSeal
                    initials={from?.name ? nameToInitials(from.name) : "?"}
                    size={72}
                  />
                </div>
              </div>

              <h1 className="mt-12 font-display text-2xl font-bold text-[var(--foreground)]">
                {letter.title}
              </h1>

              {/* From / for */}
              {(from?.name || recipientNames.length > 0) && (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {from?.name && `From ${from.name}`}
                  {recipientNames.length > 0 && from?.name && " · "}
                  {recipientNames.length > 0 && `For ${recipientNames.join(", ")}`}
                </p>
              )}

              {/* Unlock condition badge */}
              <div className="mt-4 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
                {letter.unlock_on_passing ? (
                  <>🕊️ Opens when {from?.name || "the sender"} passes{letter.unlock_date && ` or on ${formatDateOnly(letter.unlock_date)}`}</>
                ) : (
                  <>🔒 Opens {formatDateOnly(letter.unlock_date)}</>
                )}
              </div>

              {/* Flavour text */}
              <p className="mt-6 max-w-xs text-sm italic leading-relaxed text-[var(--muted)]">
                &ldquo;Some things are worth waiting for. Come back on that date and it will open for you.&rdquo;
              </p>

              {isSender && <DeleteTimeCapsuleButton id={letter.id} className="mt-8" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
