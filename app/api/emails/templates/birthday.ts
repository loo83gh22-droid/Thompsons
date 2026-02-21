import { appUrl, card, ctaButton, emailWrapper, esc } from "./shared";

export function birthdayEmailHtml(name: string, ageText: string, recipientName: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">🎂</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">${esc(name)}'s birthday is in 3 days!${ageText}</h1>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">
    Hi ${esc(recipientName)}, just a heads up — ${esc(name)}'s birthday is coming up.
    Maybe write them a time capsule, share a memory, or send a message?
  </p>
  ${ctaButton("Write them a time capsule", `${appUrl}/dashboard/time-capsules`)}
`)}`);
}
