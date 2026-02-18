"use client";

/**
 * QuickCapture — floating action button that opens a bottom sheet for
 * zero-friction journal entry creation: one photo + one sentence + who.
 * The entry is saved as a real journal entry and can be expanded later.
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { createJournalEntry } from "@/app/dashboard/journal/actions";
import { VoiceDictation } from "@/app/components/VoiceDictation";

type Member = { id: string; name: string };

const MOMENT_PROMPTS = [
  "What's happening right now?",
  "One thing worth remembering today…",
  "Capture this moment.",
  "What made you smile today?",
  "Quick — what's going on?",
];

export function QuickCapture() {
  const { activeFamilyId } = useFamily();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState("");
  const [moment, setMoment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptIndex] = useState(() => Math.floor(Math.random() * MOMENT_PROMPTS.length));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeFamilyId || !open) return;
    const supabase = createClient();
    supabase
      .from("family_members")
      .select("id, name")
      .eq("family_id", activeFamilyId)
      .order("name")
      .then(({ data }) => {
        if (data) setMembers(data as Member[]);
      });
  }, [activeFamilyId, open]);

  useEffect(() => {
    if (open) {
      // Small delay so the sheet animates in before focusing
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setMoment("");
    setPhoto(null);
    setPhotoPreview(null);
    setMemberId("");
    setError(null);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    e.target.value = "";
  }

  async function handleSave() {
    if (!moment.trim()) {
      setError("Add a sentence about the moment.");
      return;
    }
    if (!memberId) {
      setError("Who is this about?");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("family_member_id", memberId);
      formData.set("title", moment.trim().slice(0, 80));
      formData.set("content", moment.trim());
      formData.set("trip_date", new Date().toISOString().split("T")[0]);
      formData.set("location", "");
      formData.set("location_type", "visit");
      if (photo) formData.append("photos", photo);

      const result = await createJournalEntry(formData);
      if (result.success) {
        close();
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick capture a moment"
        title="Quick capture"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] transition-transform active:scale-95 md:bottom-8 md:right-8"
      >
        <span className="text-2xl leading-none" aria-hidden>+</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          aria-hidden
          onClick={close}
        />
      )}

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick capture a moment"
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--border)]" />

        <div className="px-4 pb-8 pt-4 sm:px-6">
          <div className="flex items-start justify-between">
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              Capture a moment
            </h2>
            <button
              type="button"
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Photo strip */}
            <div className="flex items-center gap-3">
              {photoPreview ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] text-2xl text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  aria-label="Add photo"
                >
                  📷
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handlePhotoChange}
                aria-label="Add photo"
              />

              {/* Moment text */}
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={moment}
                  onChange={(e) => setMoment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={MOMENT_PROMPTS[promptIndex]}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            {/* Who + dictate row */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none min-w-[140px]"
              >
                <option value="">Who is this about?</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <VoiceDictation
                onTranscript={(text) => {
                  setMoment((prev) => prev + text);
                  textareaRef.current?.focus();
                }}
                disabled={saving}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !moment.trim() || !memberId}
                className="flex-1 rounded-full bg-[var(--primary)] py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save moment"}
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
            </div>

            <p className="text-center text-xs text-[var(--muted)]">
              Saved to Journal — expand it later with more detail.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
