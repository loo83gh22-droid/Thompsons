"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Volume2, ChevronLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  getVocabularyForReview,
  recordFlashcardResult,
  type VocabItem,
} from "../actions";

function speakSpanish(text: string) {
  if (typeof window === "undefined") return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<(VocabItem & { box_level?: number })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getVocabularyForReview(15);
    setCards(data);
    setCurrentIndex(0);
    setShowAnswer(false);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResult(correct: boolean) {
    const card = cards[currentIndex];
    if (!card) return;
    await recordFlashcardResult(card.id, correct);
    if (currentIndex >= cards.length - 1) {
      await load();
    } else {
      setCurrentIndex((i) => i + 1);
      setShowAnswer(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="text-[var(--muted)]">Loading flashcards...</span>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
          All caught up!
        </h2>
        <p className="mt-2 text-[var(--muted)]">
          No cards due for review. Check back later or add more vocabulary.
        </p>
        <Link
          href="/dashboard/spanish"
          className="mt-6 inline-flex items-center gap-2 text-[var(--accent)] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Flashcards
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Card {currentIndex + 1} of {cards.length}
        </p>
      </div>

      <div
        className="mx-auto max-w-md cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg transition-all hover:border-[var(--accent)]/30"
        onClick={() => !showAnswer && setShowAnswer(true)}
      >
        <div className="flex flex-col items-center gap-6">
          <p className="font-display text-3xl font-bold text-[var(--foreground)]">
            {showAnswer ? card.english : card.spanish}
          </p>
          {showAnswer && (
            <p className="text-lg text-[var(--muted)]">
              {card.spanish} → {card.english}
            </p>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakSpanish(card.spanish);
              }}
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              title="Listen"
            >
              <Volume2 className="h-6 w-6" />
            </button>
            {!showAnswer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAnswer(true);
                }}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
              >
                Show answer
              </button>
            )}
          </div>
        </div>
      </div>

      {showAnswer && (
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => handleResult(false)}
            className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-6 py-3 text-red-400 hover:bg-red-500/20"
          >
            <ThumbsDown className="h-5 w-5" />
            Incorrect
          </button>
          <button
            onClick={() => handleResult(true)}
            className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-6 py-3 text-green-400 hover:bg-green-500/20"
          >
            <ThumbsUp className="h-5 w-5" />
            Correct
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-[var(--muted)]">
        Leitner system: correct → next box. Wrong → back to box 0.
      </p>
    </div>
  );
}
