"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { submitFeedback, type FeedbackCategory } from "./actions";

const CATEGORIES: { value: FeedbackCategory; label: string; icon: string; description: string }[] = [
  { value: "feature_request", label: "Suggest a Feature", icon: "\u{1F4A1}", description: "Have an idea to make things better?" },
  { value: "bug_report", label: "Report a Problem", icon: "\u{26A0}\uFE0F", description: "Something broken or not working right?" },
  { value: "question", label: "Ask a Question", icon: "\u{2753}", description: "Need help or have a question?" },
  { value: "compliment", label: "Share a Compliment", icon: "\u{2764}\uFE0F", description: "Let us know what you love!" },
  { value: "other", label: "Something Else", icon: "\u{1F4AC}", description: "Anything else on your mind?" },
];

const PLACEHOLDERS: Record<FeedbackCategory, { subject: string; body: string }> = {
  feature_request: { subject: "What would you like to see?", body: "Describe the feature and how it would help your family..." },
  bug_report: { subject: "What went wrong?", body: "What happened? What did you expect to happen instead?" },
  question: { subject: "What do you need help with?", body: "Ask away \u2014 we\u2019re happy to help..." },
  compliment: { subject: "What\u2019s working well?", body: "Tell us what you enjoy about the site..." },
  other: { subject: "What\u2019s on your mind?", body: "Share your thoughts..." },
};

const RATING_EMOJIS = [
  { value: 1, emoji: "\u{1F61E}", label: "Very unhappy" },
  { value: 2, emoji: "\u{1F641}", label: "Unhappy" },
  { value: 3, emoji: "\u{1F610}", label: "Neutral" },
  { value: 4, emoji: "\u{1F642}", label: "Happy" },
  { value: 5, emoji: "\u{1F929}", label: "Love it!" },
];

const CONFIRMATION_MESSAGES: Record<FeedbackCategory, string> = {
  feature_request: "We\u2019ll review your suggestion and consider it for future updates.",
  bug_report: "We\u2019ll look into this and update the status when it\u2019s fixed.",
  question: "We\u2019ll get back to you with an answer.",
  compliment: "That made our day! Thanks for letting us know.",
  other: "We appreciate you taking the time to share this.",
};

export function FeedbackForm() {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCategory, setSubmittedCategory] = useState<FeedbackCategory | null>(null);

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot must be under 5 MB");
      return;
    }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setCategory(null);
    setSubject("");
    setBody("");
    setRating(null);
    setScreenshot(null);
    setScreenshotPreview(null);
    setError(null);
    setSubmitted(false);
    setSubmittedCategory(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !subject.trim() || !body.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let screenshotUrl: string | null = null;

      if (screenshot && activeFamilyId) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const path = `${activeFamilyId}/${user.id}_${Date.now()}.${screenshot.name.split(".").pop() || "png"}`;
          const { error: uploadError } = await supabase.storage
            .from("feedback-screenshots")
            .upload(path, screenshot, { upsert: true });
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("feedback-screenshots")
              .getPublicUrl(path);
            screenshotUrl = publicUrl;
          }
        }
      }

      const result = await submitFeedback(
        category,
        subject,
        body,
        rating,
        screenshotUrl,
        typeof window !== "undefined" ? window.location.href : null,
      );

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSubmittedCategory(category);
      setSubmitted(true);
      setLoading(false);

      setTimeout(() => {
        setSubmitted(false);
        resetForm();
        router.refresh();
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setLoading(false);
    }
  }

  if (submitted && submittedCategory) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold text-[var(--foreground)]">
          Thanks for your feedback!
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {CONFIRMATION_MESSAGES[submittedCategory]}
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="mt-6 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Cards */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
          What would you like to do?
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => { setCategory(cat.value); setError(null); }}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all min-h-[44px] ${
                category === cat.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">{cat.icon}</span>
              <div>
                <span className="block text-sm font-semibold text-[var(--foreground)]">{cat.label}</span>
                <span className="block text-xs text-[var(--muted)]">{cat.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Progressive form fields - only shown after category selection */}
      {category && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              How are you feeling about Family Nest? <span className="text-[var(--muted)] font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              {RATING_EMOJIS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRating(rating === r.value ? null : r.value)}
                  title={r.label}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border text-xl transition-all ${
                    rating === r.value
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 scale-110"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:scale-105"
                  }`}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="feedback-subject" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Subject
            </label>
            <input
              id="feedback-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={PLACEHOLDERS[category].subject}
              maxLength={200}
              required
              className="input-base w-full"
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="feedback-body" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Details
            </label>
            <textarea
              id="feedback-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={PLACEHOLDERS[category].body}
              rows={5}
              maxLength={5000}
              required
              className="input-base w-full resize-y"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">{body.length}/5000</p>
          </div>

          {/* Screenshot */}
          <div>
            <label htmlFor="feedback-screenshot" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Attach a screenshot <span className="text-[var(--muted)] font-normal">(optional, max 5 MB)</span>
            </label>
            <input
              id="feedback-screenshot"
              type="file"
              accept="image/*"
              onChange={handleScreenshot}
              className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--surface)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--surface-hover)]"
            />
            {screenshotPreview && (
              <div className="mt-2 relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshotPreview} alt="Screenshot preview" className="h-24 rounded-lg border border-[var(--border)] object-cover" />
                <button
                  type="button"
                  onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                  aria-label="Remove screenshot"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !subject.trim() || !body.trim()}
            className="rounded-full bg-[var(--accent)] px-6 py-3 font-medium text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? "Submitting\u2026" : "Submit Feedback"}
          </button>
        </div>
      )}
    </form>
  );
}
