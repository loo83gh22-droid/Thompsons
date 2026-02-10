"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { addVoiceMemo } from "./actions";

type Member = { id: string; name: string };
type Mode = "upload" | "record";

function RecordedPreview({ blob, onReRecord }: { blob: Blob; onReRecord: () => void }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="flex items-center gap-2">
      <audio src={url} controls className="max-h-10" />
      <button
        type="button"
        onClick={onReRecord}
        className="text-sm text-[var(--muted)] underline hover:text-[var(--foreground)]"
      >
        Re-record
      </button>
    </div>
  );
}

export function AddVoiceMemoForm({ onAdded }: { onAdded?: () => void }) {
  const router = useRouter();
  const { activeFamilyId } = useFamily();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [who, setWho] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<Mode>("record");
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeFamilyId) return;
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_members")
        .select("id, name")
        .eq("family_id", activeFamilyId)
        .order("name");
      if (data) setMembers(data as Member[]);
    }
    fetchMembers();
  }, [activeFamilyId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
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
      };
      recorder.start();
      setRecording(true);
      setRecordedBlob(null);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not access microphone."
      );
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let file: File | null = null;

    if (mode === "record") {
      if (!recordedBlob || recordedBlob.size === 0) {
        setError("Please record an audio first.");
        return;
      }
      file = new File([recordedBlob], "recording.webm", { type: recordedBlob.type });
    } else {
      const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
      file = input?.files?.[0] ?? null;
      if (!file || file.size === 0) {
        setError("Please select an audio file.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      await addVoiceMemo(file, {
        familyMemberId: who || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setWho("");
      setTitle("");
      setDescription("");
      setRecordedBlob(null);
      setRecordSeconds(0);
      setOpen(false);
      router.refresh();
      onAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        data-voice-memo-add
        onClick={() => setOpen(true)}
        className="min-h-[44px] rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--accent-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        + Add voice memo
      </button>
    );
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">
        Add a voice memo
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Record directly or upload an audio file. MP3, M4A, WAV, OGG, or WebM.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("record");
            setRecordedBlob(null);
            setError(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "record"
              ? "bg-[var(--accent)] text-[var(--background)]"
              : "border border-[var(--border)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Record
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("upload");
            setRecordedBlob(null);
            setError(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-[var(--accent)] text-[var(--background)]"
              : "border border-[var(--border)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Upload
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Who is this from?
          </label>
          <select
            value={who}
            onChange={(e) => setWho(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Select...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. How we met, Mom's lullaby"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Recorded at Christmas 2024"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {mode === "record" ? (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Audio
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {!recording && !recordedBlob && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 font-medium text-white hover:bg-red-500"
                >
                  <span className="h-3 w-3 rounded-full bg-white" />
                  Start recording
                </button>
              )}
              {recording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 font-medium text-white hover:bg-red-500"
                >
                  <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
                  Stop ({formatTime(recordSeconds)})
                </button>
              )}
              {recordedBlob && !recording && (
                <RecordedPreview
                  blob={recordedBlob}
                  onReRecord={() => {
                    setRecordedBlob(null);
                    setRecordSeconds(0);
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">
              Audio file
            </label>
            <input
              name="file"
              type="file"
              accept="audio/mp3,audio/mpeg,audio/m4a,audio/x-m4a,audio/wav,audio/ogg,audio/webm"
              required={mode === "upload"}
              className="mt-1 w-full text-sm text-[var(--foreground)] file:mr-4 file:rounded file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:font-semibold file:text-[var(--background)]"
            />
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading || (mode === "record" && !recordedBlob)}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium hover:bg-[var(--surface-hover)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
