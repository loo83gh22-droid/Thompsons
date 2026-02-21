import { appUrl, card, ctaButton, emailWrapper, esc } from "./shared";

interface DigestCounts {
  journals: number;
  photos: number;
  voices: number;
  stories: number;
}

export function digestEmailHtml(name: string, familyName: string, counts: DigestCounts): string {
  const items: string[] = [];
  if (counts.journals) items.push(`${counts.journals} journal ${counts.journals === 1 ? "entry" : "entries"}`);
  if (counts.photos) items.push(`${counts.photos} photo${counts.photos === 1 ? "" : "s"}`);
  if (counts.voices) items.push(`${counts.voices} voice memo${counts.voices === 1 ? "" : "s"}`);
  if (counts.stories) items.push(`${counts.stories} ${counts.stories === 1 ? "story" : "stories"}`);
  const summary = items.join(", ");

  return emailWrapper(`
<tr><td style="text-align:center;padding-bottom:24px;">
  <span style="font-size:28px;color:#D4A843;font-weight:700;">${esc(familyName)} Nest</span>
</td></tr>
${card(`
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">This week in your Family Nest</h1>
  <p style="margin:0 0 4px;color:#94a3b8;font-size:15px;">Hi ${esc(name)},</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">
    Your family added <strong style="color:#f8fafc;">${summary}</strong> this week. Don't miss out!
  </p>
  ${ctaButton("See what's new", `${appUrl}/dashboard`)}
`)}`);
}
