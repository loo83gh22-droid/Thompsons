/**
 * Gift recipient email — sent when a buyer completes payment for a
 * Family Nest gift. The recipient clicks the link, lands on the
 * /gift/claim/[token] page, and creates their own account.
 *
 * Tone: warm and personal. The buyer chose this for them. Not a
 * marketing email.
 */

import { esc, emailWrapper, card, ctaButton, appUrl } from "./shared";

export type GiftRecipientEmailInput = {
  recipientName: string;
  buyerName: string;
  giftMessage: string; // empty string if no message
  redemptionToken: string;
};

export function buildGiftRecipientEmail(input: GiftRecipientEmailInput): {
  subject: string;
  html: string;
} {
  const recipient = esc(input.recipientName.trim() || "there");
  const buyer = esc(input.buyerName.trim() || "Someone who loves you");
  const claimUrl = `${appUrl}/gift/claim/${encodeURIComponent(input.redemptionToken)}`;

  const messageBlock = input.giftMessage.trim()
    ? `<tr><td style="padding-top:8px;">
        <div style="background:#0f172a;border-left:3px solid #D4A843;padding:16px 20px;border-radius:6px;">
          <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;font-style:italic;">"${esc(input.giftMessage.trim())}"</p>
          <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">— ${buyer}</p>
        </div>
      </td></tr>`
    : "";

  const subject = `${input.buyerName} gave you a Family Nest`;

  const html = emailWrapper(
    card(`
      <h1 style="color:#f1f5f9;font-size:22px;margin:0 0 16px;line-height:1.3;">
        ${recipient}, ${buyer} gave you a Family Nest. 🎁
      </h1>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Family Nest is a private space for the people you come home to — journals, voice memos, photos, letters, and the everyday moments worth holding onto. No ads. No algorithm. Yours forever.
      </p>
      ${messageBlock}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr><td style="text-align:center;padding:8px 0;">
          ${ctaButton("Open your Nest", claimUrl)}
        </td></tr>
      </table>
      <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:20px 0 0;">
        You'll set your own password — these credentials are yours from day one. There's nothing to install. It works in any browser.
      </p>
      <p style="color:#64748b;font-size:12px;line-height:1.5;margin:16px 0 0;">
        This link is just for you. Take your time — you can claim the gift whenever you're ready.
      </p>
    `)
  );

  return { subject, html };
}
