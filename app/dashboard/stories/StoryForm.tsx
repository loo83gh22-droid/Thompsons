"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createStory } from "./actions";

type Member = { id: string; name: string };

const CATEGORIES = [
  { value: "memorable_moments", label: "Memorable Moments" },
  { value: "family_history", label: "Family History" },
  { value: "advice_wisdom", label: "Advice & Wisdom" },
  { value: "traditions", label: "Traditions" },
  { value: "recipes_food", label: "Recipes & Food" },
  { value: "other", label: "Other" },
];

export function StoryForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("memorable_moments");
  const [published, setPublished] = useState(true);
  const [authorMemberId, setAuthorMemberId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createStory(title.trim(), content, category, published, null, authorMemberId || null);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(result.id ? `/dashboard/stories/${result.id}` : "/dashboard/stories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5">
      <div>
        <label htmlFor="story-title" className="block text-sm font-medium text-[var(--muted)]">Title</label>
        <input
          id="story-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="input-base mt-1"
          placeholder="e.g. How we met"
        />
      </div>
      <div>
        <label htmlFor="story-category" className="block text-sm font-medium text-[var(--muted)]">Category</label>
        <select id="story-category" value={category} onChange={(e) => setCategory(e.target.value)} className="input-base mt-1">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="story-content" className="block text-sm font-medium text-[var(--muted)]">Story</label>
        <textarea
          id="story-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="input-base mt-1 min-h-[200px] resize-y"
          placeholder="Write your story here. Line breaks are preserved."
        />
      </div>
      <div>
        <label htmlFor="story-author" className="block text-sm font-medium text-[var(--muted)]">Credit author (optional)</label>
        <select id="story-author" value={authorMemberId} onChange={(e) => setAuthorMemberId(e.target.value)} className="input-base mt-1">
          <option value="">Me (logged-in user)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded" />
        <span className="text-sm text-[var(--muted)]">Publish to family (uncheck to save as draft)</span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={loading} className="btn-submit rounded-lg bg-[var(--accent)] font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50">
          {loading ? "Publishing..." : "Publish story"}
        </button>
        <Link href="/dashboard/stories" className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]">
          Cancel
        </Link>
      </div>
    </form>
  );
}
