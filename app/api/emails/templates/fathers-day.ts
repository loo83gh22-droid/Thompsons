/**
 * Father's Day promotional email template.
 *
 * Sent as a one-shot campaign blast (not part of the lifecycle drip)
 * to the marketing/announce list in the weeks leading up to
 * Father's Day. Distinct from the transactional gift-purchase emails
 * in `gift-buyer-confirmation.ts` and `gift-recipient.ts`.
 *
 * There are two variants:
 *   - fathersDayPromoEmailHtml(name) — early send (2-3 weeks out)
 *   - fathersDayLastCallEmailHtml(name) — final-week reminder
 *
 * Both link to /gift?campaign=fathers-day so we can attribute
 * traffic from this email in analytics later.
 */

import { appUrl, card, ctaButton, emailWrapper, esc } from "./shared";

const GIFT_URL = `${appUrl}/gift?campaign=fathers-day`;

export function fathersDayPromoEmailHtml(recipientName: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">👔</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Father's Day is June 15.</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(recipientName)},</p>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;line-height:1.55;">
    A tie sits in a drawer. A bottle of whisky's gone by Tuesday. A weekend away gets forgotten by the next one.
  </p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.55;">
    The Legacy plan is different. It's a private nest for the stories he tells, the songs he hums, the photos in shoeboxes nobody's scanned yet. Pay once. The whole family keeps it forever.
  </p>
  <p style="margin:0 0 4px;color:#f8fafc;font-size:15px;line-height:1.55;">
    <strong>What it looks like:</strong>
  </p>
  <ul style="margin:0 0 24px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li>Voice memos — capture his laugh, his bedtime songs, the way he tells the same story every Thanksgiving</li>
    <li>A shared journal for the kids and grandkids to add to over time</li>
    <li>Photo galleries you can actually find things in</li>
    <li>Time capsules he can leave for the family to open years from now</li>
  </ul>
  ${ctaButton("Give Dad his Family Nest", GIFT_URL)}
  <p style="margin:16px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
    $349 one-time. No subscription, ever. The whole family joins free.
  </p>
`)}`);
}

export function fathersDayLastCallEmailHtml(recipientName: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">⏰</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">One week until Father's Day.</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(recipientName)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.55;">
    Quick reminder — Father's Day is Sunday. If you've been thinking about giving Dad something he'll actually keep, the Legacy plan still lands instantly. We email it to him; he sets a password and walks in. Takes him about a minute.
  </p>
  <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.55;">
    No shipping. No wrapping. Nothing to forget at the door on the way out.
  </p>
  ${ctaButton("Send it now", GIFT_URL)}
  <p style="margin:16px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
    $349 one-time · Theirs for life · The whole family joins free.
  </p>
`)}`);
}
