import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Navbar } from "@/app/components/home/Navbar";
import { Footer } from "@/app/components/home/Footer";
import { ClaimForm } from "./ClaimForm";

export const metadata: Metadata = {
  title: "Open your Family Nest gift",
  description: "Claim your Family Nest. Set your own password and start adding memories.",
};

// This page is the entry point recipients land on from the email link.
// We look up the pending_gifts row server-side, branch by status, and
// render the appropriate UI. Token never goes through cache (force
// dynamic) since the row's status changes on redemption.
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type PageState =
  | { kind: "claim"; gift: GiftRow; existingAccount: boolean }
  | { kind: "already-redeemed"; gift: GiftRow }
  | { kind: "invalid" };

type GiftRow = {
  id: string;
  redemption_token: string;
  buyer_name: string;
  recipient_name: string;
  recipient_email: string;
  gift_message: string | null;
  status: string;
};

async function loadGift(token: string): Promise<PageState> {
  // Reject anything that doesn't look like our 64-char hex token
  // before hitting the DB.
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return { kind: "invalid" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: gift } = await supabase
    .from("pending_gifts")
    .select("id, redemption_token, buyer_name, recipient_name, recipient_email, gift_message, status")
    .eq("redemption_token", token)
    .single();

  if (!gift) return { kind: "invalid" };

  if (gift.status === "redeemed") {
    return { kind: "already-redeemed", gift };
  }

  if (gift.status !== "pending") {
    // 'expired' or 'refunded'
    return { kind: "invalid" };
  }

  // Check whether an auth account already exists for this email so we
  // can route them to the sign-in path instead of the new-account form.
  const { data: existing } = await supabase
    .from("family_members")
    .select("user_id")
    .eq("contact_email", gift.recipient_email.toLowerCase())
    .not("user_id", "is", null)
    .maybeSingle();

  return { kind: "claim", gift, existingAccount: !!existing };
}

export default async function ClaimGiftPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await loadGift(token);

  return (
    <div className="landing" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <main className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-xl px-6">
          {state.kind === "claim" && (
            <ClaimView
              gift={state.gift}
              existingAccount={state.existingAccount}
              token={token}
            />
          )}
          {state.kind === "already-redeemed" && <AlreadyRedeemedView gift={state.gift} />}
          {state.kind === "invalid" && <InvalidView />}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ClaimView({
  gift,
  existingAccount,
  token,
}: {
  gift: GiftRow;
  existingAccount: boolean;
  token: string;
}) {
  const firstName = gift.recipient_name.split(" ")[0] || gift.recipient_name;

  return (
    <>
      <div className="text-center">
        <p className="text-6xl" aria-hidden="true">
          🎁
        </p>
        <p
          className="mt-6 text-sm font-medium uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          A gift from {gift.buyer_name}
        </p>
        <h1
          className="mt-3 text-3xl md:text-4xl font-bold"
          style={{
            fontFamily: "var(--font-display-serif)",
            color: "var(--foreground)",
          }}
        >
          {firstName}, your Family Nest is waiting.
        </h1>
        <p
          className="mx-auto mt-5 max-w-md text-base leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          A private space for the people you come home to. Journals, voice
          memos, photos, letters. You set your own password — these credentials
          are yours from day one.
        </p>
      </div>

      {gift.gift_message && (
        <div
          className="mt-8 rounded-2xl p-5"
          style={{
            backgroundColor: "var(--card)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            A note from {gift.buyer_name}
          </p>
          <p
            className="mt-2 italic leading-relaxed"
            style={{ color: "var(--foreground)" }}
          >
            &ldquo;{gift.gift_message}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-10">
        <ClaimForm
          token={token}
          recipientEmail={gift.recipient_email}
          existingAccount={existingAccount}
        />
      </div>
    </>
  );
}

function AlreadyRedeemedView({ gift }: { gift: GiftRow }) {
  const firstName = gift.recipient_name.split(" ")[0] || gift.recipient_name;
  return (
    <div className="text-center">
      <p className="text-5xl" aria-hidden="true">
        ✨
      </p>
      <h1
        className="mt-6 text-2xl md:text-3xl font-bold"
        style={{
          fontFamily: "var(--font-display-serif)",
          color: "var(--foreground)",
        }}
      >
        This gift has already been opened.
      </h1>
      <p
        className="mx-auto mt-5 max-w-md text-base leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        {firstName} has claimed this Family Nest. Sign in with the email
        address the gift was sent to.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-colors"
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
      >
        Sign in to your Nest
      </Link>
    </div>
  );
}

function InvalidView() {
  return (
    <div className="text-center">
      <p className="text-5xl" aria-hidden="true">
        🔍
      </p>
      <h1
        className="mt-6 text-2xl md:text-3xl font-bold"
        style={{
          fontFamily: "var(--font-display-serif)",
          color: "var(--foreground)",
        }}
      >
        We couldn&apos;t find this gift.
      </h1>
      <p
        className="mx-auto mt-5 max-w-md text-base leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        The link may have been mistyped, or the gift may have been refunded.
        Check the email you received, or get in touch and we&apos;ll help.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-full px-6 py-3 text-sm font-medium"
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
          Contact support
        </Link>
      </div>
    </div>
  );
}
