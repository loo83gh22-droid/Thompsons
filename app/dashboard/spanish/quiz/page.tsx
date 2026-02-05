"use client";

import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { getGrammarQuestions, recordGrammarAttempt } from "../actions";

type Question = {
  id: string;
  infinitive: string;
  tense: string;
  person: string;
  correct_answer: string;
  wrong_answers: string[];
};

function speakSpanish(text: string) {
  if (typeof window === "undefined") return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGrammarQuestions(20).then((q) => {
      setQuestions(q);
      if (q.length) setOptions(shuffle([q[0].correct_answer, ...q[0].wrong_answers]));
      setLoading(false);
    });
  }, []);

  async function handleSelect(opt: string) {
    if (feedback) return;
    const q = questions[currentIndex];
    if (!q) return;
    const correct = opt === q.correct_answer;
    setSelected(opt);
    setFeedback(correct ? "correct" : "wrong");
    await recordGrammarAttempt(q.id, correct);
  }

  function nextQuestion() {
    setSelected(null);
    setFeedback(null);
    const next = currentIndex + 1;
    if (next >= questions.length) {
      setQuestions([]);
      setCurrentIndex(0);
      getGrammarQuestions(20).then((q) => {
        setQuestions(q);
        if (q.length) setOptions(shuffle([q[0].correct_answer, ...q[0].wrong_answers]));
      });
    } else {
      setCurrentIndex(next);
      const q = questions[next];
      setOptions(shuffle([q.correct_answer, ...q.wrong_answers]));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="text-[var(--muted)]">Loading quiz...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="text-[var(--muted)]">Loading quiz...</span>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Grammar Quiz
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Conjugate the verb in the present tense.
      </p>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <p className="text-sm text-[var(--muted)]">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <p className="mt-4 font-display text-2xl font-semibold text-[var(--foreground)]">
          Conjugate <strong className="text-[var(--accent)]">{q.infinitive}</strong> for{" "}
          <strong>{q.person}</strong>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => speakSpanish(q.correct_answer)}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            title="Listen to correct answer"
          >
            <Volume2 className="h-5 w-5" />
          </button>
          <span className="text-sm text-[var(--muted)]">Listen</span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!feedback}
              className={`rounded-lg border px-4 py-3 text-left font-medium transition-colors ${
                !feedback
                  ? "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
                  : opt === q.correct_answer
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : opt === selected && !(opt === q.correct_answer)
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-[var(--border)] opacity-60"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {feedback && (
          <div className="mt-8">
            <p
              className={
                feedback === "correct"
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {feedback === "correct"
                ? "¡Correcto!"
                : `Incorrect. The answer is ${q.correct_answer}.`}
            </p>
            <button
              onClick={nextQuestion}
              className="mt-4 rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)]"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
