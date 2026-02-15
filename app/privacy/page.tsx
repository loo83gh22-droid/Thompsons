import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Back to home
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold text-[var(--foreground)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <div className="mt-8 space-y-6 text-[var(--foreground)]/90">
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              1. What We Collect
            </h2>
            <p className="mt-2 text-sm">
              We collect your email, name, and the content you upload (photos, journal entries, etc.). This data is used to provide the service and is shared only with family members you invite.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              2. How We Use Your Data
            </h2>
            <p className="mt-2 text-sm">
              Your data is used to operate Our Family Nest—storing your memories, enabling sharing with family, and improving the experience. We do not sell your data or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              3. Data Storage & Security
            </h2>
            <p className="mt-2 text-sm">
              Data is stored on secure servers (Supabase). We use industry-standard practices to protect your information. You can delete your account and data at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              4. Contact
            </h2>
            <p className="mt-2 text-sm">
              For privacy questions, use the &quot;Send feedback&quot; link in the app or contact us at the email configured for your deployment.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-[var(--muted)]">
          <Link href="/" className="text-[var(--primary)] hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
