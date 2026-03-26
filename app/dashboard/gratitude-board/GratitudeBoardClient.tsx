"use client";

import { useState, useTransition } from "react";
import { postGratitude, deleteGratitude } from "./actions";

type Member = { id: string; name: string; nickname: string | null };
type Post = { id: string; content: string; created_at: string; member_id: string; member_name: string };

const MAX = 280;

export function GratitudeBoardClient({
  posts: initialPosts,
  members,
  currentMemberId,
}: {
  posts: Post[];
  members: Member[];
  currentMemberId: string | null;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentMember = members.find((m) => m.id === currentMemberId);

  function handlePost() {
    if (!currentMemberId || !text.trim()) return;
    setError(null);
    const optimistic: Post = {
      id: crypto.randomUUID(),
      content: text.trim(),
      created_at: new Date().toISOString(),
      member_id: currentMemberId,
      member_name: currentMember?.nickname ?? currentMember?.name ?? "You",
    };
    setPosts((p) => [optimistic, ...p]);
    const draft = text;
    setText("");
    setComposing(false);
    startTransition(async () => {
      const res = await postGratitude(draft);
      if (!res.success) {
        setPosts((p) => p.filter((x) => x.id !== optimistic.id));
        setError(res.error ?? "Failed to post.");
      }
    });
  }

  function handleDelete(id: string) {
    setPosts((p) => p.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await deleteGratitude(id);
      if (!res.success) setError(res.error ?? "Failed to delete.");
    });
  }

  const displayed = filterMemberId ? posts.filter((p) => p.member_id === filterMemberId) : posts;

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {members.length > 1 && (
            <select
              value={filterMemberId ?? ""}
              onChange={(e) => setFilterMemberId(e.target.value || null)}
              className="input-base h-9 rounded-full px-3 py-0 text-sm"
            >
              <option value="">Everyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>
              ))}
            </select>
          )}
          <span className="text-sm text-[var(--muted)]">
            {displayed.length} {displayed.length === 1 ? "gratitude" : "gratitudes"}
          </span>
        </div>
        {currentMemberId && !composing && (
          <button
            onClick={() => setComposing(true)}
            className="min-h-[44px] rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            + Post a gratitude
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Compose */}
      {composing && (
        <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--card)] p-5">
          <p className="mb-3 text-sm font-medium text-[var(--foreground)]">
            What are you grateful for today?
          </p>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="I'm grateful for..."
            className="input-base w-full resize-none"
            autoFocus
          />
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs ${text.length > MAX * 0.9 ? "text-amber-500" : "text-[var(--muted)]"}`}>
              {text.length}/{MAX}
            </span>
            <div className="flex gap-2">
              <button onClick={() => { setComposing(false); setText(""); }}
                className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                Cancel
              </button>
              <button onClick={handlePost} disabled={isPending || !text.trim()}
                className="rounded-full bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60">
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      {displayed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
          <p className="text-4xl">🌟</p>
          <p className="mt-3 text-[var(--muted)]">Nothing posted yet. Be the first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((post) => {
            const date = new Date(post.created_at);
            const isOwn = post.member_id === currentMemberId;
            return (
              <div key={post.id}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[var(--foreground)]">{post.content}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {post.member_name} &middot; {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  {isOwn && (
                    <button onClick={() => handleDelete(post.id)} disabled={isPending}
                      className="mt-0.5 shrink-0 text-xs text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
