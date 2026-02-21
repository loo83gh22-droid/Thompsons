import { appUrl, card, ctaButton, emailWrapper, esc } from "./shared";

export function capsuleEmailHtml(recipientName: string, senderName: string, title: string): string {
  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">💌</span></td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">A time capsule has been unlocked!</h1>
  <p style="margin:0 0 8px;color:#94a3b8;font-size:15px;line-height:1.5;">Hi ${esc(recipientName)},</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">
    ${esc(senderName)} wrote you a letter called <strong style="color:#f8fafc;">"${esc(title)}"</strong> and today is the day it was meant to be opened.
  </p>
  ${ctaButton("Read your letter", `${appUrl}/dashboard/time-capsules`)}
`)}`);
}
