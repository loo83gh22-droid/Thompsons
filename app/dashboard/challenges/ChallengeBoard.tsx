"use client";

import { useState, useTransition } from "react";
import { createChallenge, markDone, checkInToday, completeChallenge, deleteChallenge } from "./actions";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { canManageMembers } from "@/src/lib/roles";
import { STARTER_CHALLENGES } from "./STARTER_CHALLENGES";

const EMOJI_OPTIONS = ["🎯", "📚", "🏃", "🍳", "🌿", "📵", "🎲", "✉️", "🌅", "🙏", "💪", "🎨", "🎵", "🧹", "🤸", "🌍", "🏕️", "🧘", "🥗", "💬"];

const CARD_GRADIENTS = [
  "from-rose-50 to-pink-50 border-rose-200",
  "from-blue-50 to-sky-50 border-blue-200",
  "from-emerald-50 to-green-50 border-emerald-200",
  "from-violet-50 to-purple-50 border-violet-200",
  "from-amber-50 to-yellow-50 border-amber-200",
  "from-teal-50 to-cyan-50 border-teal-200",
];

type Member = { id: string; name: string; nickname: string | null };

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  challenge_type: "single" | "daily";
  duration_days: number | null;
  end_date: string | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  completions: { family_member_id: string }[];
  todayCheckins: { family_member_id: string }[];
  totalCheckins: number;
  colorClass: string;
};

function daysLeft(endDate: string | null): string | null {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Ended";
  if (diff === 0) return "Last day!";
  return `${diff} day${diff !== 1 ? "s" : ""} left`;
}

function MemberProgress({
  members,
  doneIds,
  size = "sm",
}: {
  members: Member[];
  doneIds: Set<string>;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => {
        const done = doneIds.has(m.id);
        return (
          <div key={m.id} className="flex items-center gap-1.5">
            <span
              className={`flex items-center justify-center rounded-full font-bold text-white transition-all ${
                size === "md" ? "h-8 w-8 text-sm" : "h-6 w-6 text-xs"
              } ${done ? "bg-emerald-400 scale-110" : "bg-[var(--border)] text-[var(--muted)]"}`}
              title={m.nickname || m.name}
            >
              {done ? "✓" : (m.nickname || m.name).charAt(0)}
            </span>
            <span className={`text-[var(--muted)] ${size === "md" ? "text-sm" : "text-xs"}`}>
              {m.nickname || m.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function NewChallengeModal({
  onClose,
  onStarterPick,
}: {
  onClose: () => void;
  onStarterPick?: (c: (typeof STARTER_CHALLENGES)[0]) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emoji, setEmoji] = useState("🎯");
  const [type, setType] = useState<"single" | "daily">("single");
  const [showStarters, setShowStarters] = useState(true);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("emoji", emoji);
    fd.set("challenge_type", type);
    startTransition(async () => {
      const result = await createChallenge(fd);
      if (!result.success) { setError(result.error); return; }
      onClose();
    });
  }

  function useStarter(s: (typeof STARTER_CHALLENGES)[0]) {
    setEmoji(s.emoji);
    setType(s.challenge_type);
    setShowStarters(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-1 font-display text-xl font-bold">New Challenge</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">Set a goal your whole family can tackle together.</p>

        {showStarters && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Quick start</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STARTER_CHALLENGES.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => useStarter(s)}
                  className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition-all hover:border-[var(--accent)] hover:shadow-sm"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight text-[var(--foreground)]">{s.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)] line-clamp-2">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowStarters(false)}
              className="mt-2 text-xs text-[var(--accent)] hover:underline"
            >
              Build from scratch instead
            </button>
          </div>
        )}

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji */}
          <div>
            <label className="mb-2 block text-sm font-medium">Pick an emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-10 w-10 rounded-lg text-xl transition-all ${
                    emoji === e
                      ? "bg-[var(--accent)]/10 ring-2 ring-[var(--accent)] scale-110"
                      : "bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Challenge name <span className="text-red-500">*</span></label>
            <input name="title" required placeholder="e.g. Cook Together This Week" className="input-base w-full" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description <span className="text-xs text-[var(--muted)] font-normal">(optional)</span></label>
            <textarea name="description" rows={2} placeholder="What does completing this look like?" className="input-base w-full resize-none" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("single")}
                className={`flex-1 rounded-xl border p-3 text-left transition-all ${
                  type === "single"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50"
                }`}
              >
                <p className="text-sm font-semibold">One-time</p>
                <p className="text-xs text-[var(--muted)]">Everyone marks it done once</p>
              </button>
              <button
                type="button"
                onClick={() => setType("daily")}
                className={`flex-1 rounded-xl border p-3 text-left transition-all ${
                  type === "daily"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50"
                }`}
              >
                <p className="text-sm font-semibold">Daily streak</p>
                <p className="text-xs text-[var(--muted)]">Check in every day</p>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Duration</label>
            <select name="duration_days" className="input-base w-full">
              <option value="">No end date</option>
              <option value="7">1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isPending} className="min-h-[44px] flex-1 rounded-full bg-[var(--primary)] font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60">
              {isPending ? "Creating…" : "Start challenge 🚀"}
            </button>
            <button type="button" onClick={onClose} className="min-h-[44px] rounded-full border border-[var(--border)] px-5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge,
  members,
  currentMemberId,
  canManage,
  index,
}: {
  challenge: Challenge;
  members: Member[];
  currentMemberId: string | null;
  canManage: boolean;
  index: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showCelebration, setShowCelebration] = useState(false);

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const isCompleted = challenge.status === "completed";

  const doneIds = new Set(challenge.completions.map((c) => c.family_member_id));
  const todayIds = new Set(challenge.todayCheckins.map((c) => c.family_member_id));

  const currentMemberDone = currentMemberId ? doneIds.has(currentMemberId) : false;
  const currentMemberCheckedInToday = currentMemberId ? todayIds.has(currentMemberId) : false;

  const allDone = members.length > 0 && members.every((m) => doneIds.has(m.id));
  const allCheckedInToday = members.length > 0 && members.every((m) => todayIds.has(m.id));

  const timeLeft = daysLeft(challenge.end_date);

  async function handleAction() {
    if (!currentMemberId) return;
    startTransition(async () => {
      if (challenge.challenge_type === "single") {
        await markDone(challenge.id, currentMemberId);
      } else {
        await checkInToday(challenge.id, currentMemberId);
      }
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    });
  }

  async function handleComplete() {
    if (!confirm("Mark this challenge as complete for everyone?")) return;
    startTransition(async () => { await completeChallenge(challenge.id); });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${challenge.title}"?`)) return;
    startTransition(async () => { await deleteChallenge(challenge.id); });
  }

  const progressCount = challenge.challenge_type === "single"
    ? doneIds.size
    : todayIds.size;
  const progressPct = members.length > 0 ? Math.round((progressCount / members.length) * 100) : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all ${gradient} ${
        isPending ? "opacity-70" : ""
      } ${isCompleted ? "opacity-60" : ""}`}
    >
      {showCelebration && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-emerald-400/20 backdrop-blur-sm">
          <p className="text-4xl animate-bounce">🎉</p>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <span className="text-4xl">{challenge.emoji}</span>
        <div className="flex items-center gap-2">
          {timeLeft && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              timeLeft === "Ended" || timeLeft === "Last day!"
                ? "bg-red-100 text-red-600"
                : "bg-white/60 text-[var(--muted)]"
            }`}>
              {timeLeft}
            </span>
          )}
          {challenge.challenge_type === "daily" && (
            <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
              Daily
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-3 font-display text-lg font-bold leading-snug text-[var(--foreground)]">
        {challenge.title}
        {isCompleted && <span className="ml-2 text-emerald-500">✓</span>}
      </h3>

      {challenge.description && (
        <p className="mt-1 text-sm text-[var(--muted)]">{challenge.description}</p>
      )}

      {/* Progress bar */}
      {!isCompleted && members.length > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {challenge.challenge_type === "daily"
              ? `${todayIds.size} of ${members.length} checked in today`
              : `${doneIds.size} of ${members.length} done`}
          </p>
        </div>
      )}

      {/* Member progress */}
      <div className="mt-3">
        <MemberProgress
          members={members}
          doneIds={challenge.challenge_type === "single" ? doneIds : todayIds}
        />
      </div>

      {/* Action button */}
      {!isCompleted && currentMemberId && (
        <div className="mt-4">
          {challenge.challenge_type === "single" ? (
            currentMemberDone ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                ✓ You did it!
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAction}
                disabled={isPending}
                className="min-h-[44px] rounded-full bg-[var(--foreground)] px-6 py-2 text-sm font-bold text-[var(--background)] transition-all hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-60"
              >
                {isPending ? "…" : "I did it! 🙌"}
              </button>
            )
          ) : (
            currentMemberCheckedInToday ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                ✓ Checked in today
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAction}
                disabled={isPending}
                className="min-h-[44px] rounded-full bg-[var(--foreground)] px-6 py-2 text-sm font-bold text-[var(--background)] transition-all hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-60"
              >
                {isPending ? "…" : "Check in ✓"}
              </button>
            )
          )}
        </div>
      )}

      {/* Admin actions */}
      {canManage && !isCompleted && (
        <div className="mt-3 flex gap-3 border-t border-black/5 pt-3">
          {(allDone || allCheckedInToday) && (
            <button
              type="button"
              onClick={handleComplete}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Mark complete 🏁
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto text-xs text-[var(--muted)] hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function ChallengeBoard({
  rawChallenges,
  members,
}: {
  rawChallenges: {
    id: string;
    title: string;
    description: string | null;
    emoji: string;
    challenge_type: string;
    duration_days: number | null;
    end_date: string | null;
    status: string;
    created_at: string;
    challenge_completions: { family_member_id: string }[];
    challenge_checkins: { family_member_id: string; checkin_date: string }[];
  }[];
  members: Member[];
}) {
  const { currentUserRole, currentMemberId } = useFamily();
  const canManage = canManageMembers(currentUserRole);
  const [showNew, setShowNew] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const challenges: Challenge[] = rawChallenges.map((c, i) => ({
    ...c,
    challenge_type: c.challenge_type as "single" | "daily",
    status: c.status as "active" | "completed" | "cancelled",
    completions: c.challenge_completions,
    todayCheckins: c.challenge_checkins.filter((ci) => ci.checkin_date === today),
    totalCheckins: c.challenge_checkins.length,
    colorClass: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
  }));

  const active = challenges.filter((c) => c.status === "active");
  const completed = challenges.filter((c) => c.status === "completed");
  const [showCompleted, setShowCompleted] = useState(false);

  const isEmpty = challenges.length === 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[var(--muted)]">
          {active.length === 0
            ? "No active challenges. Start one!"
            : `${active.length} active challenge${active.length !== 1 ? "s" : ""}`}
        </p>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="min-h-[44px] rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-colors"
        >
          + New challenge
        </button>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] py-12 text-center">
          <p className="text-5xl">🎯</p>
          <p className="mt-3 font-semibold text-[var(--foreground)]">No challenges yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Set a goal your family can tackle together.</p>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="mt-4 rounded-full bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start your first challenge
          </button>
        </div>
      ) : (
        <>
          {active.length === 0 && (
            <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-8 text-center">
              <p className="text-3xl">🏁</p>
              <p className="mt-2 font-semibold text-[var(--foreground)]">All caught up!</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Start a new challenge to keep the momentum going.</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((c, i) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                members={members}
                currentMemberId={currentMemberId}
                canManage={canManage}
                index={i}
              />
            ))}
          </div>

          {completed.length > 0 && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setShowCompleted((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <span>🏆 Completed challenges ({completed.length})</span>
                <span className={`transition-transform ${showCompleted ? "rotate-180" : ""}`}>▼</span>
              </button>
              {showCompleted && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {completed.map((c, i) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      members={members}
                      currentMemberId={currentMemberId}
                      canManage={canManage}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showNew && <NewChallengeModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
