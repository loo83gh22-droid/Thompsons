"use client";

import { useState, useTransition } from "react";
import { updateBook, setFamilyPick, deleteBook, addBook, type BookStatus } from "./actions";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { canManageMembers } from "@/src/lib/roles";

type Book = {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  rating: number | null;
  notes: string | null;
  is_family_pick: boolean;
  member_id: string;
  memberName: string;
  memberColor: string;
};

const MEMBER_COLORS = [
  "#e85d8a", "#4299e1", "#48bb78", "#9f7aea",
  "#ed8936", "#38b2ac", "#f687b3", "#76e4f7",
];

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "Currently Reading",
  finished: "Finished",
  want_to_read: "Want to Read",
};

const STATUS_EMOJI: Record<BookStatus, string> = {
  reading: "📖",
  finished: "✅",
  want_to_read: "🔖",
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={onChange ? "button" : undefined}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`text-lg leading-none transition-transform ${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
        >
          <span className={(hovered || value) >= star ? "text-yellow-400" : "text-[var(--border)]"}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function AddBookModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<BookStatus>("want_to_read");
  const [rating, setRating] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (rating > 0) fd.set("rating", String(rating));
    startTransition(async () => {
      const result = await addBook(fd);
      if (!result.success) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <h2 className="mb-4 font-display text-xl font-bold">Add a book</h2>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title <span className="text-red-500">*</span></label>
            <input name="title" required placeholder="e.g. The Alchemist" className="input-base w-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Author <span className="text-xs text-[var(--muted)] font-normal">(optional)</span></label>
            <input name="author" placeholder="e.g. Paulo Coelho" className="input-base w-full" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <div className="flex gap-2">
              {(["reading", "finished", "want_to_read"] as BookStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all ${
                    status === s
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  {STATUS_EMOJI[s]}<br />{STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <input type="hidden" name="status" value={status} />
          </div>
          {status === "finished" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Notes <span className="text-xs text-[var(--muted)] font-normal">(optional)</span></label>
            <textarea name="notes" rows={2} placeholder="What did you think? Any quotes you loved?" className="input-base w-full resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isPending} className="min-h-[44px] flex-1 rounded-full bg-[var(--primary)] font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60">
              {isPending ? "Adding…" : "Add book"}
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

function BookCard({
  book,
  canManage,
  currentMemberId,
}: {
  book: Book;
  canManage: boolean;
  currentMemberId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const isOwn = book.member_id === currentMemberId;

  function moveShelf(status: BookStatus) {
    startTransition(async () => {
      await updateBook(book.id, {
        status,
        rating: status !== "finished" ? null : book.rating,
      });
    });
  }

  function handleRate(rating: number) {
    startTransition(async () => {
      await updateBook(book.id, { rating });
    });
  }

  function handlePickToggle() {
    startTransition(async () => {
      await setFamilyPick(book.is_family_pick ? null : book.id);
    });
  }

  function handleDelete() {
    if (!confirm(`Remove "${book.title}"?`)) return;
    startTransition(async () => {
      await deleteBook(book.id);
    });
  }

  return (
    <div
      className={`group rounded-xl border bg-[var(--card)] p-4 transition-all ${
        book.is_family_pick
          ? "border-[var(--accent)]/60 shadow-sm"
          : "border-[var(--border)]"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-[var(--foreground)] line-clamp-2">{book.title}</p>
          {book.author && (
            <p className="mt-0.5 text-sm text-[var(--muted)]">{book.author}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: book.memberColor }}
            />
            <span className="text-xs text-[var(--muted)]">{book.memberName}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {canManage && (
            <button
              type="button"
              onClick={handlePickToggle}
              title={book.is_family_pick ? "Remove family pick" : "Set as family pick"}
              className={`text-base transition-transform hover:scale-110 ${
                book.is_family_pick ? "opacity-100" : "opacity-20 group-hover:opacity-60"
              }`}
            >
              ⭐
            </button>
          )}
          {(isOwn || canManage) && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {expanded ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {book.status === "finished" && (
        <div className="mt-2">
          <StarRating value={book.rating ?? 0} onChange={isOwn ? handleRate : undefined} />
        </div>
      )}

      {book.notes && (
        <p className="mt-2 text-sm italic text-[var(--muted)] line-clamp-2">&ldquo;{book.notes}&rdquo;</p>
      )}

      {expanded && (isOwn || canManage) && (
        <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Move to shelf</p>
          <div className="flex flex-wrap gap-1.5">
            {(["reading", "finished", "want_to_read"] as BookStatus[]).map((s) => (
              s !== book.status && (
                <button
                  key={s}
                  type="button"
                  onClick={() => moveShelf(s)}
                  className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {STATUS_EMOJI[s]} {STATUS_LABELS[s]}
                </button>
              )
            ))}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Remove book
          </button>
        </div>
      )}
    </div>
  );
}

function ShelfSection({
  status,
  books,
  canManage,
  currentMemberId,
}: {
  status: BookStatus;
  books: Book[];
  canManage: boolean;
  currentMemberId: string | null;
}) {
  if (books.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        <span>{STATUS_EMOJI[status]}</span>
        {STATUS_LABELS[status]}
        <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-normal normal-case tracking-normal">
          {books.length}
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <BookCard key={b.id} book={b} canManage={canManage} currentMemberId={currentMemberId} />
        ))}
      </div>
    </section>
  );
}

export function BookShelf({
  rawBooks,
  members,
}: {
  rawBooks: {
    id: string;
    title: string;
    author: string | null;
    status: string;
    rating: number | null;
    notes: string | null;
    is_family_pick: boolean;
    member_id: string;
  }[];
  members: { id: string; name: string; nickname: string | null }[];
}) {
  const { currentUserRole, currentMemberId } = useFamily();
  const canManage = canManageMembers(currentUserRole);
  const [showAdd, setShowAdd] = useState(false);

  const memberColorMap = new Map(
    members.map((m, i) => [m.id, MEMBER_COLORS[i % MEMBER_COLORS.length]])
  );
  const memberNameMap = new Map(
    members.map((m) => [m.id, m.nickname || m.name])
  );

  const books: Book[] = rawBooks.map((b) => ({
    ...b,
    status: b.status as BookStatus,
    memberName: memberNameMap.get(b.member_id) ?? "Unknown",
    memberColor: memberColorMap.get(b.member_id) ?? "#94a3b8",
  }));

  const familyPick = books.find((b) => b.is_family_pick);
  const reading = books.filter((b) => b.status === "reading" && !b.is_family_pick);
  const finished = books.filter((b) => b.status === "finished");
  const wantToRead = books.filter((b) => b.status === "want_to_read");

  const isEmpty = books.length === 0;

  return (
    <div>
      {/* Header actions */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[var(--muted)]">
          {isEmpty ? "Your shelf is empty. What is everyone reading?" : `${books.length} book${books.length !== 1 ? "s" : ""} on the shelf`}
        </p>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="min-h-[44px] rounded-full bg-[var(--primary)] px-5 py-2 font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-colors"
        >
          + Add a book
        </button>
      </div>

      {/* Family Pick banner */}
      {familyPick && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)]/5 to-[var(--card)] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            ⭐ Family Pick
          </p>
          <p className="font-display text-2xl font-bold text-[var(--foreground)]">{familyPick.title}</p>
          {familyPick.author && (
            <p className="mt-0.5 text-[var(--muted)]">by {familyPick.author}</p>
          )}
          {familyPick.notes && (
            <p className="mt-2 text-sm italic text-[var(--muted)]">&ldquo;{familyPick.notes}&rdquo;</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: familyPick.memberColor }} />
            <span className="text-xs text-[var(--muted)]">Added by {familyPick.memberName}</span>
            {canManage && (
              <button
                type="button"
                onClick={async () => { await setFamilyPick(null); }}
                className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Clear pick
              </button>
            )}
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] py-16 text-center">
          <p className="text-5xl">📚</p>
          <p className="mt-3 font-semibold text-[var(--foreground)]">No books yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Add what you are reading, finished, or want to read next.</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-full bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Add your first book
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <ShelfSection status="reading" books={reading} canManage={canManage} currentMemberId={currentMemberId} />
          <ShelfSection status="finished" books={finished} canManage={canManage} currentMemberId={currentMemberId} />
          <ShelfSection status="want_to_read" books={wantToRead} canManage={canManage} currentMemberId={currentMemberId} />
        </div>
      )}

      {canManage && !isEmpty && (
        <p className="mt-6 text-xs text-[var(--muted)]">
          Tip: tap ⭐ on any book to set it as the Family Pick.
        </p>
      )}

      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
