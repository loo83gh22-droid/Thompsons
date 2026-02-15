import Link from "next/link";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <div className="mt-8 space-y-6 text-[var(--foreground)]/90">
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2 text-sm">
              By using Our Family Nest, you agree to these Terms of Service. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              2. Description of Service
            </h2>
            <p className="mt-2 text-sm">
              Our Family Nest is a private family documentation and sharing platform. You can document memories, photos, journal entries, and share them with invited family members.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              3. Your Responsibilities
            </h2>
            <p className="mt-2 text-sm">
              You are responsible for the content you upload and share. Do not upload content that infringes others&apos; rights or violates applicable laws. Keep your account credentials secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              4. Privacy
            </h2>
            <p className="mt-2 text-sm">
              Your data is stored securely. We do not sell your information. See our{" "}
              <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
              5. Changes
            </h2>
            <p className="mt-2 text-sm">
              We may update these terms. Continued use of the service after changes constitutes acceptance.
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
