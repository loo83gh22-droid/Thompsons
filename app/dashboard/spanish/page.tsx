import Link from "next/link";
import { Flame, BookOpen, ClipboardCheck, MessageCircle, Trophy } from "lucide-react";
import { getDashboardStats } from "./actions";

export default async function SpanishDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Spanish Training
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Learn together. {stats.memberName && `${stats.memberName}'s progress.`}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Flame className="h-5 w-5" />
            <span className="font-display text-lg font-semibold">Streak</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {stats.streak} {stats.streak === 1 ? "day" : "days"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Study every day to keep your streak.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Trophy className="h-5 w-5" />
            <span className="font-display text-lg font-semibold">Vocabulary</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {stats.vocabularyMastered} mastered
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Words in Leitner box 5.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:col-span-2 lg:col-span-1">
          <span className="font-display text-lg font-semibold text-[var(--accent)]">
            Quick start
          </span>
          <div className="mt-4 space-y-2">
            <Link
              href="/dashboard/spanish/flashcards"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--surface-hover)]"
            >
              <BookOpen className="h-4 w-4" />
              Practice flashcards
            </Link>
            <Link
              href="/dashboard/spanish/quiz"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--surface-hover)]"
            >
              <ClipboardCheck className="h-4 w-4" />
              Grammar quiz
            </Link>
            <Link
              href="/dashboard/spanish/tutor"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--surface-hover)]"
            >
              <MessageCircle className="h-4 w-4" />
              Ask the AI tutor
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
          How it works
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>
            <strong className="text-[var(--foreground)]">Flashcards</strong> – Leitner spaced repetition. Review cards; correct answers move them to higher boxes.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Grammar Quiz</strong> – Conjugate verbs in the present tense (-ar, -er, -ir).
          </li>
          <li>
            <strong className="text-[var(--foreground)]">AI Tutor</strong> – Ask grammar questions in English, get explanations in Spanish.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Audio</strong> – Click the speaker icon to hear Spanish phrases.
          </li>
        </ul>
      </div>
    </div>
  );
}
