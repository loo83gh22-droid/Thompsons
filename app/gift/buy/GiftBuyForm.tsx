"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 500;

export function GiftBuyForm({
  priceUsd,
  isFoundingActive,
}: {
  priceUsd: number;
  isFoundingActive: boolean;
}) {
  const searchParams = useSearchParams();
  const wasCancelled = searchParams.get("cancelled") === "1";

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/gift/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName,
          recipientEmail,
          buyerName,
          buyerEmail,
          giftMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {wasCancelled && (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
          style={{ color: "var(--foreground)" }}
        >
          Checkout was cancelled. Your details below are still here — pick up where you left off when you&apos;re ready.
        </div>
      )}

      {/* Recipient section */}
      <fieldset
        className="rounded-2xl p-5"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <legend
          className="px-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          Who&apos;s receiving the gift?
        </legend>

        <div className="mt-2 flex flex-col gap-4">
          <div>
            <label
              htmlFor="recipientName"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Their name
            </label>
            <input
              id="recipientName"
              name="recipientName"
              type="text"
              required
              maxLength={MAX_NAME}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Mom"
              className="w-full rounded-lg border px-4 py-3 text-base"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="recipientEmail"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Their email
            </label>
            <input
              id="recipientEmail"
              name="recipientEmail"
              type="email"
              required
              maxLength={MAX_EMAIL}
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="mom@example.com"
              className="w-full rounded-lg border px-4 py-3 text-base"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
              Tip: use an email they already check. They&apos;ll log in with this address.
            </p>
          </div>
        </div>
      </fieldset>

      {/* Optional gift message */}
      <fieldset
        className="rounded-2xl p-5"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <legend
          className="px-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          A message (optional)
        </legend>

        <div className="mt-2">
          <textarea
            id="giftMessage"
            name="giftMessage"
            maxLength={MAX_MESSAGE}
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            rows={4}
            placeholder="Write a short note. They'll see it in the email and on the redemption page."
            className="w-full rounded-lg border px-4 py-3 text-base leading-relaxed"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <p className="mt-1 text-right text-xs" style={{ color: "var(--muted)" }}>
            {giftMessage.length} / {MAX_MESSAGE}
          </p>
        </div>
      </fieldset>

      {/* Buyer section */}
      <fieldset
        className="rounded-2xl p-5"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <legend
          className="px-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          Who&apos;s sending it?
        </legend>

        <div className="mt-2 flex flex-col gap-4">
          <div>
            <label
              htmlFor="buyerName"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Your name
            </label>
            <input
              id="buyerName"
              name="buyerName"
              type="text"
              required
              maxLength={MAX_NAME}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="The recipient will see this in the email"
              className="w-full rounded-lg border px-4 py-3 text-base"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="buyerEmail"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Your email
            </label>
            <input
              id="buyerEmail"
              name="buyerEmail"
              type="email"
              required
              maxLength={MAX_EMAIL}
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="For your receipt"
              className="w-full rounded-lg border px-4 py-3 text-base"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>
      </fieldset>

      {/* Refund policy */}
      <p
        className="text-center text-xs leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        Gifts are refundable any time before the recipient redeems them. After
        redemption, all sales are final.
      </p>

      {error && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm"
          style={{ color: "var(--foreground)" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-lg"
        style={{
          backgroundColor: "var(--accent)",
          color: "#fff",
        }}
      >
        {submitting ? "Starting checkout…" : `Continue to payment — $${priceUsd}`}
      </button>

      {isFoundingActive && (
        <p
          className="text-center text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          Founding Family rate. $349 after Mother&apos;s Day.
        </p>
      )}
    </form>
  );
}
