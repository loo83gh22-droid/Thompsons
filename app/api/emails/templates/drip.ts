/**
 * Activation drip campaign email templates (Day 1, 3, 5, 14, 30).
 */
import { appUrl, card, ctaButton, emailWrapper, esc } from "./shared";

export function day1ActivationEmailHtml(name: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">📷</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Your family's story starts with one photo</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;line-height:1.5;">Yesterday you created your Family Nest. We noticed you haven't uploaded your first photo yet!</p>
  <p style="margin:0 0 4px;color:#94a3b8;font-size:15px;"><strong style="color:#f8fafc;">Here's why your first photo matters:</strong></p>
  <ul style="margin:8px 0 20px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li>It kicks off your family timeline</li>
    <li>It becomes searchable and shareable</li>
    <li>It inspires others in your family to contribute</li>
  </ul>
  ${ctaButton("Upload Your First Photo Now", `${appUrl}/dashboard/photos`)}
`)}`);
}

export function day3DiscoveryEmailHtml(name: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">✨</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Did you know? Your Nest has these hidden gems</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">Your Family Nest can do so much more than store photos. Here are a few features worth exploring:</p>
  <ul style="margin:0 0 20px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li><strong style="color:#f8fafc;">Voice Memos</strong> — Record grandparents telling stories</li>
    <li><strong style="color:#f8fafc;">Recipes</strong> — Preserve family recipes with the story behind them</li>
    <li><strong style="color:#f8fafc;">Time Capsules</strong> — Write letters to future family members</li>
    <li><strong style="color:#f8fafc;">Family Map</strong> — Pin your family's important places</li>
  </ul>
  ${ctaButton("Explore Features", `${appUrl}/dashboard`)}
`)}`);
}

export function day5InviteEmailHtml(name: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">👋</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Your family is waiting to join!</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">A Family Nest is so much better when the whole family is involved. Imagine grandparents seeing photos the same day they happen, or cousins sharing memories from across the country.</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">Inviting family takes just 30 seconds — share a link and they're in.</p>
  ${ctaButton("Invite Your Family", `${appUrl}/dashboard/members`)}
`)}`);
}

export function day14UpgradeEmailHtml(name: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">🔓</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Ready to unlock unlimited memories?</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">You've been using your Family Nest for two weeks now — that's amazing! You're approaching the Free plan limits, and there's so much more available:</p>
  <ul style="margin:0 0 20px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li><strong style="color:#f8fafc;">Unlimited journals</strong> with video uploads</li>
    <li><strong style="color:#f8fafc;">50 GB storage</strong> for photos &amp; videos</li>
    <li><strong style="color:#f8fafc;">Voice memos, recipes, time capsules</strong></li>
    <li><strong style="color:#f8fafc;">Weekly digest</strong> + birthday reminders</li>
  </ul>
  ${ctaButton("See Plans &amp; Pricing", `${appUrl}/pricing`)}
`)}`);
}

export function day30ReengagementEmailHtml(name: string, familyName: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">💙</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Your family misses you</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">It's been a while since you've visited the ${esc(familyName)} Nest. Every day is a chance to capture a memory that future generations will treasure.</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">Even a single photo or a quick journal entry keeps the story going. Your family is counting on you.</p>
  ${ctaButton("Visit Your Nest", `${appUrl}/dashboard`)}
`)}`);
}
