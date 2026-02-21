"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { createStory, updateStory } from "./actions";
import { RichTextToolbar } from "./RichTextToolbar";
import { MemberSelect } from "@/app/components/MemberSelect";

type Member = { id: string; name: string };

const CATEGORIES = [
  { value: "family_history", label: "Family History" },
  { value: "advice_wisdom", label: "Advice & Wisdom" },
  { value: "memorable_moments", label: "Memorable Moments" },
  { value: "traditions", label: "Traditions" },
  { value: "recipes_food", label: "Recipes & Food" },
  { value: "other", label: "Other" },
];

export type EditStory = {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  cover_url: string | null;
  author_family_member_id: string | null;
};

export function StoryForm({
  members,
  defaultAuthorMemberId,
  editStory,
}: {
  members: Member[];
  defaultAuthorMemberId?: string | null;
  editStory?: EditStory | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(editStory?.title ?? "");
  const [content, setContent] = useState(editStory?.content ?? "");
  const [category, setCategory] = useState(editStory?.category ?? "memorable_moments");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    editStory?.author_family_member_id
      ? [editStory.author_family_member_id]
      : defaultAuthorMemberId
        ? [defaultAuthorMemberId]
        : []
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(editStory?.cover_url ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [published, setPublished] = useState(editStory?.published ?? true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isEdit = !!editStory?.id;

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCoverUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("story-covers").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("story-covers").getPublicUrl(path);
      setCoverUrl(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    if (isEdit) {
      const err = await updateStory(editStory!.id, {
        title: title.trim(),
        content,
        category,
        published: publish,
        cover_url: coverUrl,
        author_family_member_id: selectedMemberIds[0] || null,
      }, selectedMemberIds);
      setLoading(false);
      if (err.error) {
        setError(err.error);
        return;
      }
      router.push(`/dashboard/stories/${editStory!.id}`);
      router.refresh();
      return;
    }
    const result = await createStory(
      title.trim(),
      content,
      category,
      publish,
      coverUrl,
      selectedMemberIds[0] || null,
      selectedMemberIds
    );
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(result.id ? `/dashboard/stories/${result.id}` : "/dashboard/stories");
    router.refresh();
  }

  return (
    <form className="mt-8 max-w-2xl space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="story-title" className="block text-sm font-medium text-[var(--muted)]">
          Title <span className="text-red-600">*</span>
        </label>
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
        <label className="block text-sm font-medium text-[var(--muted)]">Cover image (optional)</label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            disabled={coverUploading}
            className="text-sm text-[var(--muted)] file:mr-2 file:rounded file:border-0 file:bg-[var(--surface-hover)] file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          {coverUploading && <span className="text-sm text-[var(--muted)]">Uploading…</span>}
          {coverUrl && (
            <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-[var(--border)]">
              <Image src={coverUrl} alt="Story cover preview" fill className="object-cover" sizes="160px" />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="story-category" className="block text-sm font-medium text-[var(--muted)]">
          Category
        </label>
        <select
          id="story-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-base mt-1"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="story-content" className="block text-sm font-medium text-[var(--muted)]">
          Story
        </label>
        <RichTextToolbar value={content} onChange={setContent} textareaRef={textareaRef} />
        <textarea
          id="story-content"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="input-base mt-0 min-h-[280px] resize-y rounded-t-none border-t-0"
          placeholder="Write your story. Use the toolbar for bold, italic, headings, lists, and links (Markdown)."
        />
      </div>

      <MemberSelect
        members={members}
        selectedIds={selectedMemberIds}
        onChange={setSelectedMemberIds}
        label="Who is this story about?"
        hint="Select the family members featured in this story."
      />

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-[var(--muted)]">
            Public to family (uncheck to keep as private draft)
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          className="btn-submit min-h-[44px] rounded-full bg-[var(--primary)] font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : isEdit ? "Update & Publish" : "Publish Story"}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, false)}
          disabled={loading}
          className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50"
        >
          {isEdit ? "Update draft" : "Save Draft"}
        </button>
        <Link
          href="/dashboard/stories"
          className="flex min-h-[44px] items-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
