"use client";

import { useState, useTransition } from "react";
import { addItem, updateItem, removeItem, restoreItem, updateList, deleteList } from "../actions";
import { useRouter } from "next/navigation";

type FamilyMember = { id: string; name: string; nickname: string | null; color: string | null };
type Item = {
  id: string;
  title: string;
  notes: string | null;
  url: string | null;
  added_by: string | null;
  removed_at: string | null;
  created_at: string;
};
type List = { id: string; name: string; emoji: string | null };

type Props = {
  list: List;
  items: Item[];
  members: FamilyMember[];
  myMemberId: string | null;
  myRole: string;
  listId: string;
};

type SortKey = "recent" | "az" | "member";

export function ListDetail({ list, items, members, myMemberId, myRole, listId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter / sort state
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");

  // Add item form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addError, setAddError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // List rename
  const [editingList, setEditingList] = useState(false);
  const [listName, setListName] = useState(list.name);
  const [listEmoji, setListEmoji] = useState(list.emoji ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canManage = myRole === "owner" || myRole === "adult";

  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Active + removed items
  const activeItems = items.filter((i) => !i.removed_at);
  const removedItems = items.filter((i) => !!i.removed_at);

  // Filter
  const filteredItems = filterMemberId
    ? activeItems.filter((i) => i.added_by === filterMemberId)
    : activeItems;

  // Sort
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "member") {
      const ma = memberMap.get(a.added_by ?? "")?.name ?? "";
      const mb = memberMap.get(b.added_by ?? "")?.name ?? "";
      return ma.localeCompare(mb);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Members who have contributed items (for filter pills)
  const contributingMemberIds = [...new Set(activeItems.map((i) => i.added_by).filter(Boolean) as string[])];

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) { setAddError("Title is required."); return; }
    setAddError("");
    startTransition(async () => {
      const result = await addItem(listId, newTitle, newNotes, newUrl);
      if (result.success) {
        setNewTitle(""); setNewNotes(""); setNewUrl(""); setShowAdd(false);
      } else {
        setAddError(result.error ?? "Something went wrong.");
      }
    });
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditNotes(item.notes ?? "");
    setEditUrl(item.url ?? "");
  }

  function handleEditSubmit(e: React.FormEvent, itemId: string) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateItem(itemId, listId, editTitle, editNotes, editUrl);
      setEditingId(null);
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => { await removeItem(itemId, listId); });
  }

  function handleRestore(itemId: string) {
    startTransition(async () => { await restoreItem(itemId, listId); });
  }

  function handleRenameList(e: React.FormEvent) {
    e.preventDefault();
    if (!listName.trim()) return;
    startTransition(async () => {
      await updateList(listId, listName, listEmoji);
      setEditingList(false);
    });
  }

  function handleDeleteList() {
    startTransition(async () => {
      await deleteList(listId);
      router.push("/dashboard/favourites");
    });
  }

  return (
    <div className="mt-4">
      {/* List header */}
      {editingList ? (
        <form onSubmit={handleRenameList} className="flex items-center gap-2">
          <input
            type="text"
            value={listEmoji}
            onChange={(e) => setListEmoji(e.target.value)}
            placeholder="😀"
            maxLength={4}
            className="w-12 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-center text-xl focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            autoFocus
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-display text-2xl font-bold focus:border-[var(--accent)] focus:outline-none"
          />
          <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={() => setEditingList(false)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]">
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            {list.emoji && <span className="mr-2">{list.emoji}</span>}
            {list.name}
          </h1>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => { setEditingList(true); setListName(list.name); setListEmoji(list.emoji ?? ""); }}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                Rename
              </button>
              {confirmDelete ? (
                <>
                  <button onClick={handleDeleteList} disabled={isPending} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs text-white hover:bg-red-600 disabled:opacity-50">
                    {isPending ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Delete list
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls: member filter + sort + add */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {/* Member filter pills */}
        <button
          onClick={() => setFilterMemberId(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            !filterMemberId ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)]"
          }`}
        >
          Everyone
        </button>
        {contributingMemberIds.map((memberId) => {
          const m = memberMap.get(memberId);
          if (!m) return null;
          return (
            <button
              key={memberId}
              onClick={() => setFilterMemberId(filterMemberId === memberId ? null : memberId)}
              className={`rounded-full px-3 py-1 text-xs font-medium text-white transition ${
                filterMemberId === memberId ? "ring-2 ring-offset-1 ring-[var(--accent)]" : "opacity-80 hover:opacity-100"
              }`}
              style={{ backgroundColor: m.color ?? "#6b7280" }}
            >
              {m.nickname ?? m.name}
            </button>
          );
        })}

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--border)] p-0.5">
          {(["recent", "az", "member"] as SortKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                sort === s ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s === "recent" ? "Recent" : s === "az" ? "A–Z" : "By member"}
            </button>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          + Add
        </button>
      </div>

      {/* Add item form */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="mt-4 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Add to {list.name}</h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title *"
            autoFocus
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Link (optional)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
          {addError && <p className="text-xs text-red-500">{addError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {isPending ? "Adding…" : "Add"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {sortedItems.length === 0 && !showAdd && (
        <div className="mt-16 text-center">
          <p className="text-[var(--muted)]">
            {filterMemberId ? "No items from this member." : "Nothing added yet."}
          </p>
          {!filterMemberId && (
            <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-[var(--accent)] hover:underline">
              Add the first item
            </button>
          )}
        </div>
      )}

      <ul className="mt-4 divide-y divide-[var(--border)]">
        {sortedItems.map((item) => {
          const member = memberMap.get(item.added_by ?? "");
          const isEditing = editingId === item.id;
          const isMine = item.added_by === myMemberId;
          const canEdit = isMine || canManage;

          return (
            <li key={item.id} className="group py-3">
              {isEditing ? (
                <form onSubmit={(e) => handleEditSubmit(e, item.id)} className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notes"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="Link"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  {/* Member color bar */}
                  {member && (
                    <span
                      className="mt-1.5 h-3.5 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: member.color ?? "#6b7280" }}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-[var(--foreground)]">{item.title}</span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ↗ Link
                        </a>
                      )}
                    </div>
                    {item.notes && (
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{item.notes}</p>
                    )}
                    {member && (
                      <span
                        className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: member.color ?? "#6b7280" }}
                      >
                        {member.nickname ?? member.name}
                      </span>
                    )}
                  </div>

                  {/* Actions — visible on hover (desktop) or always (mobile) */}
                  {canEdit && (
                    <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 sm:opacity-0">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isPending}
                        className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Removed items / history */}
      {removedItems.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            Show removed ({removedItems.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {removedItems.map((item) => {
              const member = memberMap.get(item.added_by ?? "");
              return (
                <li key={item.id} className="flex items-center gap-3 rounded-lg bg-[var(--surface)] px-3 py-2">
                  <span className="flex-1 text-sm text-[var(--muted)] line-through">{item.title}</span>
                  {member && (
                    <span className="text-xs text-[var(--muted)]">{member.nickname ?? member.name}</span>
                  )}
                  <button
                    onClick={() => handleRestore(item.id)}
                    disabled={isPending}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    Restore
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}
