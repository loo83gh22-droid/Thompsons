"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { VOICE_MEMO_LIMITS } from "@/src/lib/constants";
import { insertVoiceMemo } from "./actions";

type Member = { id: string; name: string; relationship: string | null };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function AddVoiceMemoForm({
  members,
  onAdded,
}: {
  members: Member[];
  onAdded?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"record" | "form">("record");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [recordedById, setRecordedById] = useState("");
  const [recordedForId, setRecordedForId] = useState("");
  const [recordedDate, setRecordedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordSecondsRef = useRef(0);

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordSeconds(0);
    setDurationSeconds(0);
    setStep("record");
    setError(null);
  };

  const closeModal = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
    setRecording(false);
    resetRecording();
    setTitle("");
    setRecordedById("");
    setRecordedForId("");
    setRecordedDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    if (recordSeconds >= VOICE_MEMO_LIMITS.maxRecordSeconds) {
      stopRecording();
      return;
    }
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => {
        const next = s + 1;
        recordSecondsRef.current = next;
        if (next >= VOICE_MEMO_LIMITS.maxRecordSeconds && timerRef.current) clearInterval(timerRef.current);
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Voice recording isn't supported on this browser. Please try Chrome, Safari, or Firefox."
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        setRecordedBlob(blob);
        setDurationSeconds(recordSecondsRef.current);
        setStep("form");
      };
      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError(
          "Microphone access was denied. Enable it in your browser: click the lock or info icon in the address bar, allow microphone, then reload the page."
        );
      } else {
        setError("Recording failed. Please try again.");
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }

  async function handleSave() {
    if (!recordedBlob || recordedBlob.size === 0) {
      setError("Please record audio first.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!recordedById) {
      setError("Please select who recorded this.");
      return;
    }
    if (!recordedDate) {
      setError("Please select a date.");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = "webm";
      const path = `${user.id}_${Date.now()}.${ext}`;
      const file = new File([recordedBlob], `recording.${ext}`, { type: recordedBlob.type });

      setUploadProgress(30);
      const { error: uploadError } = await supabase.storage.from("voice-memos").upload(path, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;

      setUploadProgress(70);
      const {
        data: { publicUrl },
      } = supabase.storage.from("voice-memos").getPublicUrl(path);

      await insertVoiceMemo({
        title: title.trim().slice(0, 100),
        recordedById,
        recordedForId: recordedForId || null,
        recordedDate,
        description: description.trim().slice(0, 500) || null,
        audioUrl: publicUrl,
        durationSeconds: durationSeconds,
      });

      setUploadProgress(100);
      closeModal();
      router.refresh();
      onAdded?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  const showOneMinuteWarning = recording && recordSeconds >= VOICE_MEMO_LIMITS.warningAtSeconds;

  if (!open) {
    return (
      <button
        type="button"
        data-voice-memo-add
        onClick={() => setOpen(true)}
        className="min-h-[44px] shrink-0 rounded-full bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:py-2"
      >
        + Add voice memo
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={closeModal}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-memo-title"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <h2 id="voice-memo-title" className="font-display text-lg font-semibold text-[var(--foreground)]">
              {step === "record" ? "Record" : "Save voice memo"}
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4 sm:p-6 space-y-6">
            {step === "record" && (
              <>
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="text-3xl font-mono font-semibold tabular-nums text-[var(--foreground)]" aria-live="polite">
                    {formatTime(recordSeconds)}
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {recording ? "Recording…" : "Tap to Record"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Max 10 minutes</p>

                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    disabled={recording && recordSeconds >= VOICE_MEMO_LIMITS.maxRecordSeconds}
                    className={`mt-8 flex min-h-[140px] min-w-[140px] items-center justify-center rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:min-h-[160px] sm:min-w-[160px] ${
                      recording
                        ? "bg-red-600 shadow-lg shadow-red-500/50 animate-pulse ring-4 ring-red-400/30"
                        : "bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30"
                    }`}
                    aria-label={recording ? "Stop recording" : "Start recording"}
                  >
                    <span className="text-5xl sm:text-6xl" aria-hidden="true">
                      🎙️
                    </span>
                  </button>

                  {recording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="mt-8 min-h-[48px] min-w-[160px] rounded-full bg-[var(--primary)] px-6 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90"
                    >
                      Stop Recording
                    </button>
                  )}

                  {showOneMinuteWarning && (
                    <p className="mt-6 text-sm font-medium text-amber-700" role="alert">
                      You have 1 minute remaining (max 10 minutes)
                    </p>
                  )}
                </div>
              </>
            )}

            {step === "form" && (
              <>
                {recordedBlob && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[var(--muted)]">
                      Listen to your recording
                    </p>
                    <AudioPreview blob={recordedBlob} />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="vm-title" className="block text-sm font-medium text-[var(--muted)]">
                      What is this recording? *
                    </label>
                    <input
                      id="vm-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      required
                      placeholder="e.g., Grandma reading Goodnight Moon"
                      className="input-base mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="vm-by" className="block text-sm font-medium text-[var(--muted)]">
                      Who recorded this? *
                    </label>
                    <select
                      id="vm-by"
                      value={recordedById}
                      onChange={(e) => setRecordedById(e.target.value)}
                      required
                      className="input-base mt-1"
                    >
                      <option value="">Select...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.relationship ? `${m.name} (${m.relationship})` : m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="vm-for" className="block text-sm font-medium text-[var(--muted)]">
                      Who is this for?
                    </label>
                    <select
                      id="vm-for"
                      value={recordedForId}
                      onChange={(e) => setRecordedForId(e.target.value)}
                      className="input-base mt-1"
                    >
                      <option value="">Select someone (optional)</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.relationship ? `${m.name} (${m.relationship})` : m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="vm-date" className="block text-sm font-medium text-[var(--muted)]">
                      Date *
                    </label>
                    <input
                      id="vm-date"
                      type="date"
                      value={recordedDate}
                      onChange={(e) => setRecordedDate(e.target.value)}
                      required
                      className="input-base mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="vm-desc" className="block text-sm font-medium text-[var(--muted)]">
                      Add any notes or context
                    </label>
                    <textarea
                      id="vm-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="e.g., This was her favorite bedtime story to read"
                      className="input-base mt-1 min-h-[80px] resize-y"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                <p>{error}</p>
                {step === "form" && (
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}

            {uploadProgress !== null && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-[var(--muted)]">Uploading…</p>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:flex-wrap">
              {step === "form" && (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-submit order-1 rounded-full bg-[var(--primary)] font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 sm:order-none"
                  >
                    {loading ? "Saving…" : "Save Memo"}
                  </button>
                  <button
                    type="button"
                    onClick={resetRecording}
                    disabled={loading}
                    className="btn-secondary order-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-50 sm:order-none"
                  >
                    Re-record
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary order-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] sm:order-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AudioPreview({ blob }: { blob: Blob }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  const [playbackError, setPlaybackError] = useState(false);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2">
      <audio
        src={url}
        controls
        className="h-10 w-full max-w-full"
        preload="metadata"
        onError={() => setPlaybackError(true)}
      />
      {playbackError && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          Unable to play audio. The file may be corrupted.
        </p>
      )}
    </div>
  );
}
