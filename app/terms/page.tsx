import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Family Nest",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          &larr; Back to home
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold text-[var(--foreground)]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Effective date: February 17, 2026
        </p>

        <div className="mt-8 space-y-6 text-[var(--foreground)]/90 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By creating an account or using Family Nest, you agree to these Terms of Service and our{" "}
              <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                Privacy Policy
              </Link>
              . If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              2. Description of Service
            </h2>
            <p className="mt-2">
              Family Nest is a private family documentation and memory preservation platform. You can create journals, upload photos and videos, record voice memos, save recipes, build a family tree, and share content with invited family members.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              3. Accounts &amp; Eligibility
            </h2>
            <p className="mt-2">
              You must be at least 16 years old to create an account. Kid accounts may be created by adult family members for children under 16. You are responsible for maintaining the security of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              4. Plans &amp; Billing
            </h2>
            <p className="mt-2">
              <strong>Free plan:</strong> Available at no cost with feature limitations as described on our pricing page.
            </p>
            <p className="mt-2">
              <strong>Annual plan ($79/year):</strong> Billed annually via Stripe. Your subscription will automatically renew unless cancelled before the renewal date. You may cancel at any time through the billing portal in your account settings.
            </p>
            <p className="mt-2">
              <strong>Legacy plan ($349 one-time):</strong> A single payment for lifetime access. Includes all current and future features, data export, and Nest Keeper designation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              5. Refund Policy
            </h2>
            <p className="mt-2">
              <strong>Annual plan:</strong> You may request a full refund within 14 days of your initial purchase or renewal. After 14 days, no refunds are provided but you retain access until the end of your billing period.
            </p>
            <p className="mt-2">
              <strong>Legacy plan:</strong> You may request a full refund within 30 days of purchase. After 30 days, no refunds are provided as this is a lifetime purchase.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              6. Cancellation &amp; Downgrade
            </h2>
            <p className="mt-2">
              If you cancel your Annual plan, you retain access to paid features until the end of your current billing period. After that, your account will be downgraded to the Free plan. Your data is not deleted; however, content exceeding Free plan limits will become read-only until you upgrade again or delete content.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              7. Your Content &amp; Responsibilities
            </h2>
            <p className="mt-2">
              You retain full ownership of all content you upload. We do not claim any rights to your content. You are responsible for ensuring your content does not infringe on others&apos; rights or violate applicable laws.
            </p>
            <p className="mt-2">
              You agree not to upload illegal content, malware, or content that violates the rights of others.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              8. Data Ownership &amp; Export
            </h2>
            <p className="mt-2">
              Your data is yours. Legacy plan members can export all family data at any time. If we ever discontinue the service, we will provide at least 12 months&apos; notice and a data export tool for all users, regardless of plan.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              9. Nest Keeper &amp; Ownership Transfer
            </h2>
            <p className="mt-2">
              Legacy plan members can designate a Nest Keeper who will inherit access to the family&apos;s data. If the account holder becomes inactive for 12 consecutive months, the designated Nest Keeper will be notified and can claim ownership of the Family Nest.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              10. Service Availability
            </h2>
            <p className="mt-2">
              We strive for high availability but do not guarantee 100% uptime. Scheduled maintenance will be communicated in advance. We are not liable for temporary service interruptions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              11. Limitation of Liability
            </h2>
            <p className="mt-2">
              Family Nest is provided &quot;as is.&quot; To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you have paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              12. Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these Terms from time to time. Material changes will be communicated via email to registered users at least 30 days before taking effect. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              13. Contact
            </h2>
            <p className="mt-2">
              For questions about these Terms, email{" "}
              <a
                href="mailto:support@familynest.io"
                className="text-[var(--primary)] hover:underline"
              >
                support@familynest.io
              </a>
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-[var(--muted)]">
          <Link href="/" className="text-[var(--primary)] hover:underline">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
