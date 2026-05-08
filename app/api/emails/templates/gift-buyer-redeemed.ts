/**
 * Gift buyer-redeemed email — sent when the recipient opens the gift
 * (claims the redemption link, sets up their account or applies the
 * upgrade to an existing one).
 *
 * Tone: warm and celebratory. The buyer did a good thing; let them
 * feel that. No upsell, no marketing.
 */

import { esc, emailWrapper, card, ctaButton, appUrl } from "./shared";

export type GiftBuyerRedeemedEmailInput = {
  buyerName: string;
  recipientName: string;
};

export function buildGiftBuyerRedeemedEmail(
  input: GiftBuyerRedeemedEmailInput
): { subject: string; html: string } {
  const buyer = esc(input.buyerName.trim() || "there");
  const recipient = esc(input.recipientName.trim() || "Your recipient");

  const subject = `${input.recipientName} just opened your gift`;

  const html = emailWrapper(
    card(`
      <h1 style="color:#f1f5f9;font-size:22px;margin:0 0 16px;line-height:1.3;">
        ${buyer}, ${recipient} just opened your gift. 🎁
      </h1>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">
        They've set up their Family Nest and are starting to add memories. The gift landed.
      </p>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
        If you'd like to send them a note about it, now's a nice moment.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
        <tr><td style="text-align:center;padding:8px 0;">
          ${ctaButton("Visit Family Nest", `${appUrl}`)}
        </td></tr>
      </table>
      <p style="color:#64748b;font-size:12px;line-height:1.5;margin:24px 0 0;">
        Thanks for giving something that lasts.
      </p>
    `)
  );

  return { subject, html };
}
