/**
 * Gift buyer confirmation email — sent right after the buyer
 * completes Stripe checkout. Confirms the gift was sent, includes a
 * copy of the redemption link in case they want to deliver personally
 * (wrapped on a card, slipped into a frame, etc.), and sets
 * expectations for what happens next.
 *
 * Tone: confident, warm, low-pressure. They paid; they shouldn't feel
 * marketed to.
 */

import { esc, emailWrapper, card, appUrl } from "./shared";

export type GiftBuyerConfirmationEmailInput = {
  buyerName: string;
  recipientName: string;
  recipientEmail: string;
  redemptionToken: string;
  amountPaidUsd: number;
};

export function buildGiftBuyerConfirmationEmail(
  input: GiftBuyerConfirmationEmailInput
): { subject: string; html: string } {
  const buyer = esc(input.buyerName.trim() || "there");
  const recipient = esc(input.recipientName.trim() || "your recipient");
  const recipientEmail = esc(input.recipientEmail.trim());
  const claimUrl = `${appUrl}/gift/claim/${encodeURIComponent(input.redemptionToken)}`;
  const amountFormatted = `$${input.amountPaidUsd.toFixed(2)}`;

  const subject = `Your gift to ${input.recipientName} is on its way`;

  const html = emailWrapper(
    card(`
      <h1 style="color:#f1f5f9;font-size:22px;margin:0 0 16px;line-height:1.3;">
        ${buyer}, your gift is on its way. 🎁
      </h1>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">
        We've emailed <strong style="color:#f1f5f9;">${recipient}</strong> at <span style="color:#94a3b8;">${recipientEmail}</span> with a link to claim their Family Nest. They'll set their own password and own it from day one.
      </p>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Here's their redemption link in case you want to deliver it personally — wrapped on a card, slipped into a frame, or just texted at the right moment:
      </p>
      <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 16px;">
        <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Redemption link</p>
        <p style="color:#D4A843;font-size:13px;line-height:1.4;margin:0;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
          <a href="${claimUrl}" style="color:#D4A843;text-decoration:none;">${claimUrl}</a>
        </p>
      </div>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:24px 0 0;">
        We'll email you again when ${recipient} opens it — so you know it landed.
      </p>
      <hr style="border:none;border-top:1px solid #334155;margin:24px 0;">
      <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;">
        Receipt: ${amountFormatted} — one-time payment for the Legacy plan. Your Stripe receipt has separately landed in your inbox. Need help? Reply to this email.
      </p>
      <p style="color:#475569;font-size:11px;line-height:1.5;margin:12px 0 0;">
        Refundable any time before ${recipient} redeems. After redemption, all sales are final. <a href="${appUrl}/contact" style="color:#64748b;">Contact us</a> if you need to make changes.
      </p>
    `)
  );

  return { subject, html };
}
