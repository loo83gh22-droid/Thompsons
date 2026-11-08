import type { Metadata } from "next";
import { Navbar } from "@/app/components/home/Navbar";
import { Footer } from "@/app/components/home/Footer";
import { GiftBuyForm } from "./GiftBuyForm";
import { GIFT_PURCHASES_OPEN } from "@/src/lib/serviceStatus";
import { ServiceClosedNotice } from "@/app/components/ServiceClosedNotice";

export const metadata: Metadata = {
  title: "Give the Gift of Family Nest",
  description:
    "Buy a Family Nest as a gift. Pay once. They set up their own account and own it forever.",
};

// Mother's Day 2026 cutoff — keep in sync with FoundingRateCountdown
// and app/api/gift/checkout/route.ts
const FOUNDING_RATE_END = new Date("2026-05-10T00:00:00");

// Pricing depends on `Date.now()`, so this page must render on each
// request (otherwise it would freeze the price at build time).
export const dynamic = "force-dynamic";

function isFoundingRateActive(): boolean {
  // Wrapped in a function so the impurity is at the call site, not in
  // the component body — keeps lint's purity rule happy.
  return Date.now() < FOUNDING_RATE_END.getTime();
}

export default function GiftBuyPage() {
  const isFoundingActive = isFoundingRateActive();
  const priceUsd = isFoundingActive ? 249 : 349;

  return (
    <div className="landing" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <main className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-2xl px-6">
          <div className="text-center">
            <p
              className="mb-3 text-sm font-medium uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Send a Family Nest as a gift
            </p>
            <h1
              className="mb-4 text-3xl md:text-4xl font-bold"
              style={{
                fontFamily: "var(--font-display-serif)",
                color: "var(--foreground)",
              }}
            >
              {GIFT_PURCHASES_OPEN
                ? "Tell us who it's for."
                : "Gifts are on hold right now."}
            </h1>
            <p
              className="mx-auto max-w-lg text-base leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              {GIFT_PURCHASES_OPEN
                ? "We'll email them a redemption link after you pay. They set their own password and own the Nest from day one, so you don't hand over your login."
                : "A gift only works if we can email the recipient their redemption link, and we can't send email at the moment."}
            </p>
          </div>

          <div className="mt-10">
            {GIFT_PURCHASES_OPEN ? (
              <GiftBuyForm priceUsd={priceUsd} isFoundingActive={isFoundingActive} />
            ) : (
              <ServiceClosedNotice
                title="We're not taking gift purchases right now"
                showSignIn={false}
              >
                <p>
                  A Family Nest gift works by emailing your recipient a private
                  redemption link once you&apos;ve paid. I can&apos;t send that
                  email at the moment, so taking your money today would mean
                  charging you for something I can&apos;t deliver.
                </p>
                <p>
                  I&apos;d rather tell you that up front. Nothing has been
                  charged.
                </p>
              </ServiceClosedNotice>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
