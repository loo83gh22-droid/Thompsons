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
    <li><strong style="color:#f8fafc;">Voice Memos</strong> — Record mum singing bedtime songs. Capture what the kids sound like right now.</li>
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
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">It's better when everyone's in here</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">Your Nest is most powerful when the people you actually live with are in it. Add your partner, your kids. The things you capture together become a record you all share.</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">Takes about 30 seconds. Just add them by name and they get a warm invite.</p>
  ${ctaButton("Add the people in your home", `${appUrl}/dashboard/our-family`)}
`)}`);
}

export function day14UpgradeEmailHtml(name: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">🔓</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Two weeks in. How's the Nest feeling?</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">The free plan gives you access to everything. The only limits are storage (500 MB) and members (6). If you're adding more photos, videos, or voices and want room to grow, here's what's available:</p>
  <ul style="margin:0 0 20px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li><strong style="color:#f8fafc;">Full Nest</strong> — $6.99/month, 5 GB storage, unlimited members</li>
    <li><strong style="color:#f8fafc;">Legacy (Founding Rate)</strong> — $249 one-time, 10 GB, lifetime access. Goes to $349 after Mother's Day.</li>
    <li><strong style="color:#f8fafc;">Storage add-ons</strong> available on any paid plan</li>
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
