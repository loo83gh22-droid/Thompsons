import type { Metadata } from "next";
import Link from "next/link";
import { UpgradeButton } from "./UpgradeButton";

export const metadata: Metadata = {
  title: "Pricing — Our Family Nest",
  description:
    "Choose the right plan for your family. Free, Annual, or Lifetime Legacy access.",
};

const tiers = [
  {
    name: "The Nest",
    plan: "free" as const,
    price: "Free",
    priceSub: null,
    description: "Everything you need to get started.",
    features: [
      "Family tree & member profiles",
      "Journal (up to 10 entries, photos only)",
      "Photos (500 MB storage)",
      "Family Map (view only)",
      "Messages",
      "Global search",
    ],
    cta: "Get Started",
    ctaHref: "/login?mode=signup",
    ctaNote: "Free to start — no credit card needed",
    highlighted: false,
  },
  {
    name: "The Full Nest",
    plan: "annual" as const,
    price: "$49",
    priceSub: "/year",
    priceBreakdown: "Just $4.08/month or 13¢/day",
    description: "Unlock every feature for your family.",
    badge: "Most Popular",
    features: [
      "Everything in Free, unlimited",
      "Unlimited journal entries with video uploads",
      "10 GB storage (photos + videos)",
      "Voice Memos & Stories",
      "Recipes & Traditions",
      "Time Capsules",
      "Family Map (full editing)",
      "Shareable links for stories & recipes",
      "Weekly digest & birthday reminders",
      "Multi-user roles & kid accounts",
      "Sports section",
    ],
    cta: "Start Annual Plan",
    ctaHref: "/login?mode=signup&plan=annual",
    ctaNote: null,
    highlighted: false,
  },
  {
    name: "The Legacy",
    plan: "legacy" as const,
    price: "$349",
    priceSub: " one-time",
    priceBreakdown: "Just $7/year over 50 years — true lifetime value",
    description: "Lifetime access. Pass it down.",
    badge: "Best Value",
    features: [
      "Everything in Full Nest",
      "50 GB storage",
      "Nest Keeper designation (ownership transfer)",
      "Full data export (archive download)",
      "12-month inactivity protection with successor notification",
      "Priority support",
      "All future features included",
    ],
    cta: "Get Lifetime Access",
    ctaHref: "/login?mode=signup&plan=legacy",
    ctaNote: null,
    highlighted: true,
  },
];

const faqs = [
  {
    question: "Which plan is right for me?",
    answer:
      "Start with The Nest (Free) to try the platform with your family. Once you're uploading videos, recording voice memos, or approaching the storage limit, upgrade to The Full Nest ($49/year). If you're committed to preserving your family's memories for decades and want to pass ownership to future generations, The Legacy ($349 one-time) offers lifetime access and the best long-term value.",
  },
  {
    question: "What happens if the platform shuts down?",
    answer:
      "Your data is yours. If we ever sunset the platform, we will provide at least 12 months' notice and a full data-export tool so you can download every photo, journal entry, and memory you've saved.",
  },
  {
    question: "Can I upgrade from Annual to Legacy?",
    answer:
      "Absolutely. You can upgrade at any time from The Full Nest to The Legacy plan. When you do, we'll pro-rate the remaining time on your annual subscription toward the one-time Legacy price.",
  },
  {
    question: "How does ownership transfer work?",
    answer:
      "Legacy members can designate a Nest Keeper — a family member who inherits full admin rights to the family's data. If the account holder becomes inactive for 12 months, the designated successor is notified and can claim ownership, ensuring your family's memories are never lost.",
  },
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen">
      <main className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Start free. Upgrade when your family is ready for more.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition-shadow ${
                tier.highlighted
                  ? "border-[var(--accent)] bg-[var(--card)] shadow-[0_0_40px_hsla(24,60%,50%,0.12)] lg:scale-105 lg:py-10"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              {/* Recommended badge */}
              {tier.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent-foreground)]">
                  {tier.badge}
                </span>
              )}

              {/* Tier name */}
              <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">
                {tier.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {tier.description}
              </p>

              {/* Price */}
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-[var(--accent)]">
                  {tier.price}
                </span>
                {tier.priceSub && (
                  <span className="text-base text-[var(--muted)]">
                    {tier.priceSub}
                  </span>
                )}
              </div>

              {/* Price breakdown */}
              {tier.priceBreakdown && (
                <p className="mt-2 text-sm font-medium text-[var(--muted)]">
                  {tier.priceBreakdown}
                </p>
              )}

              {/* Divider */}
              <hr className="my-6 border-[var(--border)]" />

              {/* Features */}
              <ul className="flex-1 space-y-3 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)]"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span className="text-[var(--foreground)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8">
                {tier.plan === "free" ? (
                  <Link
                    href={tier.ctaHref}
                    className="block w-full rounded-full px-6 py-3 text-center font-medium transition-all hover:scale-[1.02] border border-[var(--border)] text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <UpgradeButton
                    plan={tier.plan}
                    label={tier.cta}
                    highlighted={tier.highlighted}
                  />
                )}
                {tier.ctaNote && (
                  <p className="mt-2 text-center text-xs text-[var(--muted)]">
                    {tier.ctaNote}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--foreground)]">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
              >
                <dt className="font-display text-lg font-semibold text-[var(--accent)]">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Back link */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            &larr; Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

