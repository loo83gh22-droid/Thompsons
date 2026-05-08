import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/app/components/home/Navbar";
import { Footer } from "@/app/components/home/Footer";

export const metadata: Metadata = {
  title: "Your gift is on its way | Family Nest",
  description: "Your Family Nest gift has been sent.",
};

export default async function GiftSentPage({
  searchParams,
}: {
  searchParams: Promise<{ recipient?: string }>;
}) {
  const params = await searchParams;
  const recipientName = params.recipient?.trim() || "them";

  return (
    <div className="landing" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <main className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-2xl px-6 text-center">
          {/* Confetti emoji as the visual anchor — cheerful, not over-designed */}
          <p className="text-6xl" aria-hidden="true">
            🎁
          </p>

          <h1
            className="mt-6 text-3xl md:text-4xl font-bold"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
            }}
          >
            Your gift is on its way to {recipientName}.
          </h1>

          <p
            className="mt-5 text-base leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            We&apos;ve emailed them a redemption link. We&apos;ve also sent you a
            copy in case you want to deliver it personally — wrapped on a card,
            slipped into a frame, or just texted at the right moment.
          </p>

          <div
            className="mt-10 rounded-2xl p-6 text-left"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              What happens next
            </p>
            <ol
              className="mt-4 flex flex-col gap-3 text-sm leading-relaxed"
              style={{ color: "var(--foreground)" }}
            >
              <li>
                <strong>1.</strong> {recipientName} gets an email with a link to
                claim their Nest.
              </li>
              <li>
                <strong>2.</strong> They set their own password — the credentials
                are theirs from day one. No login-sharing.
              </li>
              <li>
                <strong>3.</strong> They land in their new Nest and can start
                adding memories whenever they&apos;re ready.
              </li>
            </ol>
            <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
              You&apos;ll also get an email when they open it — so you know it
              landed.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="rounded-full px-6 py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              Back to Family Nest
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Need help? Contact us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
