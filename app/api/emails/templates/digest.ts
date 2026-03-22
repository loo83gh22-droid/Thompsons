import { appUrl, ctaButton, emailWrapper, card, esc } from "./shared";

export interface DigestItem {
  title: string;
  authorName: string;
  thumbnailUrl: string | null;
  href: string;
  dateLabel: string; // e.g. "Monday"
}

export interface DigestSection {
  label: string;
  icon: string;
  items: DigestItem[];
}

export interface DigestData {
  familyName: string;
  recipientName: string;
  weekStart: string; // e.g. "March 17"
  weekEnd: string;   // e.g. "March 23"
  sections: DigestSection[];
  upcomingBirthdays: { name: string; daysUntil: number; turningAge: number | null }[];
  onThisDayItem: { title: string; yearsAgo: number; href: string } | null;
}

function itemRow(item: DigestItem): string {
  const thumb = `<div style="width:56px;height:56px;border-radius:6px;background:#334155;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
       <span style="font-size:22px;">📷</span>
     </div>`;

  return `
<tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="width:56px;vertical-align:top;">${thumb}</td>
    <td style="padding-left:12px;vertical-align:top;">
      <a href="${appUrl}${esc(item.href)}"
         style="display:block;font-size:14px;font-weight:600;color:#f1f5f9;text-decoration:none;line-height:1.3;margin-bottom:4px;">
        ${esc(item.title)}
      </a>
      <span style="font-size:12px;color:#64748b;">${esc(item.authorName)} &middot; ${esc(item.dateLabel)}</span>
    </td>
  </tr></table>
</td></tr>`;
}

function sectionBlock(section: DigestSection): string {
  if (section.items.length === 0) return "";
  const rows = section.items.map((i) => itemRow(i)).join("");
  return `
<tr><td style="padding-top:20px;">
  <p style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">
    ${section.icon} ${esc(section.label)}
  </p>
  <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
</td></tr>`;
}

export function digestEmailHtml(data: DigestData): string {
  const { familyName, recipientName, weekStart, weekEnd, sections, upcomingBirthdays, onThisDayItem } = data;

  const hasSections = sections.some((s) => s.items.length > 0);

  // ── Content sections ─────────────────────────────────────────────────────
  const sectionsHtml = sections.map((s) => sectionBlock(s)).join("");

  // ── Upcoming birthdays ───────────────────────────────────────────────────
  let birthdayHtml = "";
  if (upcomingBirthdays.length > 0) {
    const rows = upcomingBirthdays.map((b) => {
      const when = b.daysUntil === 0 ? "Today!" : b.daysUntil === 1 ? "Tomorrow" : `In ${b.daysUntil} days`;
      const age = b.turningAge ? ` &mdash; turning ${b.turningAge}` : "";
      return `<li style="margin:0 0 6px;font-size:14px;color:#f1f5f9;">
        <span style="font-size:16px;">🎂</span>
        <strong>${esc(b.name)}</strong>${age}
        <span style="color:#64748b;font-size:12px;"> &middot; ${esc(when)}</span>
      </li>`;
    }).join("");
    birthdayHtml = `
<tr><td style="padding-top:24px;">
  <p style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">
    Upcoming Birthdays
  </p>
  <ul style="margin:0;padding-left:4px;list-style:none;">${rows}</ul>
</td></tr>`;
  }

  // ── On This Day ──────────────────────────────────────────────────────────
  let onThisDayHtml = "";
  if (onThisDayItem) {
    onThisDayHtml = `
<tr><td style="padding-top:24px;">
  <div style="background:#1e2d1e;border:1px solid #2d4a2d;border-radius:8px;padding:14px 16px;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6aa36a;">
      On This Day
    </p>
    <p style="margin:0;font-size:14px;color:#f1f5f9;line-height:1.4;">
      <a href="${appUrl}${esc(onThisDayItem.href)}" style="color:#f1f5f9;text-decoration:none;">
        ${esc(onThisDayItem.title)}
      </a>
    </p>
    <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${onThisDayItem.yearsAgo} year${onThisDayItem.yearsAgo !== 1 ? "s" : ""} ago</p>
  </div>
</td></tr>`;
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  const emptyHtml = !hasSections ? `
<tr><td style="padding:16px 0 8px;text-align:center;">
  <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;">Your family hasn't added anything this week yet.</p>
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Be the first to capture a memory.</p>
</td></tr>` : "";

  const body = `
<tr><td style="text-align:center;padding-bottom:24px;">
  <span style="font-size:26px;color:#D4A843;font-weight:700;">${esc(familyName)} Nest</span>
</td></tr>
${card(`
  <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#f8fafc;">This week in your family</h1>
  <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;">${esc(weekStart)} &ndash; ${esc(weekEnd)}</p>
  <p style="margin:0 0 0;color:#64748b;font-size:14px;">Hi ${esc(recipientName)} &mdash; here&apos;s what everyone&apos;s been up to.</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${emptyHtml}
    ${sectionsHtml}
    ${birthdayHtml}
    ${onThisDayHtml}
    <tr><td style="padding-top:24px;">${ctaButton("Open Family Nest", `${appUrl}/dashboard`)}</td></tr>
  </table>
`)}`;

  return emailWrapper(body);
}
