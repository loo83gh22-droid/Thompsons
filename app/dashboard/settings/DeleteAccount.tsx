"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Undo2, ShieldAlert } from "lucide-react";
import {
  requestAccountDeletion,
  cancelAccountDeletion,
} from "./actions";

interface Props {
  /** If already pending, the date after which deletion will be permanent */
  pendingDeleteAfter?: string | null;
}

type Step = "idle" | "confirm1" | "confirm2" | "confirm3" | "confirm4" | "processing" | "pending";

const CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

export function DeleteAccount({ pendingDeleteAfter }: Props) {
  const [step, setStep] = useState<Step>(pendingDeleteAfter ? "pending" : "idle");
  const [deleteAfter, setDeleteAfter] = useState(pendingDeleteAfter ?? null);
  const [typedPhrase, setTypedPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function handleFinalDelete() {
    setStep("processing");
    setError(null);
    const result = await requestAccountDeletion();
    if (result.success) {
      setDeleteAfter(result.deleteAfter ?? null);
      setStep("pending");
    } else {
      setError(result.error ?? "Something went wrong.");
      setStep("confirm4");
    }
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelAccountDeletion();
    if (result.success) {
      setStep("idle");
      setDeleteAfter(null);
      setTypedPhrase("");
    } else {
      setError(result.error ?? "Could not cancel. Please contact support.");
    }
    setCancelling(false);
  }

  const formattedDate = deleteAfter
    ? new Date(deleteAfter).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  /* ── Pending state: account is scheduled for deletion ─── */
  if (step === "pending") {
    return (
      <div
        className="rounded-xl p-6"
        style={{
          border: "2px solid #dc2626",
          backgroundColor: "rgba(220,38,38,0.04)",
        }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-red-700">
              Account scheduled for deletion
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Your account and all associated data will be{" "}
              <strong>permanently deleted</strong> on{" "}
              <strong>{formattedDate}</strong>. Until then, you can cancel and
              keep your account.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              <Undo2 className="h-4 w-4" />
              {cancelling ? "Cancelling..." : "Cancel deletion and keep my account"}
            </button>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Idle state ─────────────────────────────────────────── */
  if (step === "idle") {
    return (
      <div
        className="rounded-xl p-6"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--muted)" }} />
          <div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Delete account
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Permanently delete your account and all data associated with it.
              This cannot be undone after the grace period.
            </p>
            <button
              onClick={() => setStep("confirm1")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              style={{ borderColor: "rgba(220,38,38,0.3)" }}
            >
              <Trash2 className="h-4 w-4" />
              Delete my account
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Multi-step confirmation flow ───────────────────────── */
  return (
    <div
      className="rounded-xl p-6"
      style={{
        border: "2px solid #dc2626",
        backgroundColor: "rgba(220,38,38,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-red-700">
            Are you sure? This is serious.
          </h3>

          {/* Step 1: First warning */}
          {step === "confirm1" && (
            <div className="mt-4">
              <div
                className="rounded-lg p-4 text-sm"
                style={{ backgroundColor: "rgba(220,38,38,0.06)" }}
              >
                <p className="font-medium text-red-700">
                  Deleting your account will permanently remove:
                </p>
                <ul className="mt-2 space-y-1 text-red-600">
                  <li>All journal entries, photos, and videos</li>
                  <li>All stories, recipes, and voice memos</li>
                  <li>All family trees, maps, and time capsules</li>
                  <li>Your membership in every family Nest</li>
                  <li>All data exports and backups on our servers</li>
                </ul>
                <p className="mt-3 font-semibold text-red-700">
                  If you are the owner of a Nest, the entire Nest and all its
                  members&apos; data will be deleted.
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStep("idle")}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Never mind, keep my account
                </button>
                <button
                  onClick={() => setStep("confirm2")}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  style={{ border: "1px solid rgba(220,38,38,0.3)" }}
                >
                  I understand, continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Data export reminder */}
          {step === "confirm2" && (
            <div className="mt-4">
              <div
                className="rounded-lg p-4 text-sm"
                style={{
                  backgroundColor: "rgba(61,107,94,0.06)",
                  border: "1px solid rgba(61,107,94,0.15)",
                }}
              >
                <p
                  className="font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Before you go, have you exported your data?
                </p>
                <p className="mt-1" style={{ color: "var(--muted)" }}>
                  If you&apos;re on the Full Nest or Legacy plan, you can
                  download a complete archive of all your family&apos;s content
                  from the{" "}
                  <strong style={{ color: "var(--foreground)" }}>
                    Export My Nest
                  </strong>{" "}
                  section above. Once your account is deleted, this data cannot
                  be recovered.
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStep("idle")}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Let me export first
                </button>
                <button
                  onClick={() => setStep("confirm3")}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  style={{ border: "1px solid rgba(220,38,38,0.3)" }}
                >
                  I don&apos;t need an export, continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Grace period explanation */}
          {step === "confirm3" && (
            <div className="mt-4">
              <div
                className="rounded-lg p-4 text-sm"
                style={{ backgroundColor: "rgba(220,38,38,0.06)" }}
              >
                <p className="font-medium text-red-700">
                  Here&apos;s how deletion works:
                </p>
                <ul className="mt-2 space-y-2 text-red-600">
                  <li>
                    <strong>30-day grace period:</strong> Your account will be
                    deactivated immediately, but your data stays on our servers
                    for 30 days.
                  </li>
                  <li>
                    <strong>Change your mind?</strong> You can cancel the
                    deletion any time during those 30 days by signing back in.
                  </li>
                  <li>
                    <strong>After 30 days:</strong> Everything is permanently
                    and irreversibly deleted. No exceptions. No backups. Gone
                    forever.
                  </li>
                </ul>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStep("idle")}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  I changed my mind
                </button>
                <button
                  onClick={() => setStep("confirm4")}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  style={{ border: "1px solid rgba(220,38,38,0.3)" }}
                >
                  I understand, final step
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Type confirmation phrase */}
          {(step === "confirm4" || step === "processing") && (
            <div className="mt-4">
              <p className="text-sm text-red-700">
                Type{" "}
                <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-800">
                  {CONFIRMATION_PHRASE}
                </code>{" "}
                to confirm.
              </p>
              <input
                type="text"
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                className="mt-2 w-full max-w-sm rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: "rgba(220,38,38,0.3)",
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                }}
                disabled={step === "processing"}
                autoComplete="off"
                spellCheck={false}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setStep("idle");
                    setTypedPhrase("");
                    setError(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Keep my account
                </button>
                <button
                  onClick={handleFinalDelete}
                  disabled={
                    typedPhrase !== CONFIRMATION_PHRASE ||
                    step === "processing"
                  }
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#fff",
                  }}
                >
                  {step === "processing"
                    ? "Processing..."
                    : "Permanently delete my account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
