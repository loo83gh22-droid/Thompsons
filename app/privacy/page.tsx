import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Family Nest",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Effective date: February 17, 2026
        </p>

        <div className="mt-8 space-y-6 text-[var(--foreground)]/90 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              <strong>Account information:</strong> When you sign up, we collect your name, email address, and password. If you sign up for a paid plan, payment is processed by Stripe and we do not store your credit card number.
            </p>
            <p className="mt-2">
              <strong>Content you create:</strong> Photos, journal entries, voice memos, recipes, stories, family member profiles, messages, and other content you upload or create within yFamily Nest.
            </p>
            <p className="mt-2">
              <strong>Usage data:</strong> We collect basic analytics (page views, feature usage) through Vercel Analytics to improve the service. No personal data is sold or used for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              2. How We Use Your Data
            </h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>To provide and operate the Family Nest service</li>
              <li>To share your content with the family members you invite</li>
              <li>To send transactional emails (welcome, password reset, notifications you enable)</li>
              <li>To process payments via Stripe</li>
              <li>To improve the service through anonymized analytics</li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> sell your data, use it for advertising, or share it with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              3. Third-Party Services
            </h2>
            <p className="mt-2">We use the following third-party services to operate Family Nest:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — Database, authentication, and file storage (hosted in US data centers)</li>
              <li><strong>Vercel</strong> — Application hosting and analytics</li>
              <li><strong>Stripe</strong> — Payment processing (PCI-DSS compliant)</li>
              <li><strong>Resend</strong> — Transactional email delivery</li>
              <li><strong>OpenAI</strong> — Voice transcription and AI features (data is not used to train models)</li>
              <li><strong>Google Maps</strong> — Family Map feature</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              4. Data Storage &amp; Security
            </h2>
            <p className="mt-2">
              Your data is stored on Supabase servers in the United States with encryption at rest and in transit. We use row-level security (RLS) policies to ensure family members can only access their own family&apos;s data. All connections use HTTPS/TLS encryption.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              5. Data Retention &amp; Deletion
            </h2>
            <p className="mt-2">
              Your content is stored for as long as your account is active. You can delete individual entries at any time. Legacy plan members can export all data at any time using the data export feature.
            </p>
            <p className="mt-2">
              To delete your account and all associated data, contact us at the email below. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              6. Your Rights
            </h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data (available for Legacy plan members)</li>
              <li>Opt out of non-essential emails via notification settings</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              7. Cookies
            </h2>
            <p className="mt-2">
              We use essential cookies for authentication and session management only. We do not use advertising or tracking cookies. Vercel Analytics collects anonymized page view data without cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              8. Children&apos;s Privacy
            </h2>
            <p className="mt-2">
              Family Nest is designed for families. Kid accounts are created and managed by adult family members. We do not knowingly collect data from children under 13 without parental consent.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              9. Changes to This Policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify registered users via email of any material changes. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              10. Contact
            </h2>
            <p className="mt-2">
              For privacy questions or data requests, email us at{" "}
              <a
                href="mailto:privacy@familynest.io"
                className="text-[var(--primary)] hover:underline"
              >
                privacy@familynest.io
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
