/**
 * Daily admin report email template.
 * Dark-themed, matches the FamilyNest brand.
 */

import { esc } from "./shared";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://familynest.io");

export interface AdminReportStats {
  date: string; // e.g. "Monday, February 24, 2026"

  // Platform totals
  totalFamilies: number;
  paidFamilies: number;
  freeFamilies: number;
  annualFamilies: number;
  legacyFamilies: number;
  totalMembers: number;
  membersWithAccounts: number;
  conversionPct: number;
  totalStorageGB: string;

  // Last 24 h
  newFamilies24h: number;
  newMembers24h: number;
  newContent24h: number;

  // Last 7 d
  newFamilies7d: number;
  newMembers7d: number;
  newContent7d: number;
  newFamilies30d: number;

  // Content totals
  journalEntries: number;
  photos: number;
  stories: number;
  voiceMemos: number;
  recipes: number;
  events: number;
  timeCapsules: number;
  achievements: number;
  artwork: number;
  totalContentItems: number;

  // Families list (brief)
  families: Array<{
    name: string;
    plan: string;
    memberCount: number;
    storageUsed: string;
    storageLimit: string;
    joinedAgo: string;
  }>;
}

function statBlock(label: string, value: string | number, sub?: string): string {
  return `
    <td style="text-align:center;padding:12px 8px;background:#0f172a;border-radius:8px;min-width:80px;">
      <p style="color:#94a3b8;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">${esc(label)}</p>
      <p style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0;">${typeof value === "number" ? value.toLocaleString() : esc(String(value))}</p>
      ${sub ? `<p style="color:#64748b;font-size:10px;margin:4px 0 0;">${esc(sub)}</p>` : ""}
    </td>`;
}

function sectionHeader(title: string): string {
  return `
    <tr><td style="padding:20px 0 8px;">
      <p style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0;border-bottom:1px solid #1e293b;padding-bottom:8px;">
        ${esc(title)}
      </p>
    </td></tr>`;
}

function planPill(plan: string): string {
  const colors: Record<string, string> = {
    free: "background:#1e293b;color:#94a3b8;",
    annual: "background:#1e3a5f;color:#93c5fd;",
    legacy: "background:#3d2a00;color:#fbbf24;",
  };
  return `<span style="${colors[plan] ?? colors.free}padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;text-transform:uppercase;">${esc(plan)}</span>`;
}

export function adminReportEmailHtml(stats: AdminReportStats): string {
  const familyRows = stats.families
    .map(
      (f) => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:8px 6px;color:#e2e8f0;font-size:13px;">${esc(f.name)}</td>
      <td style="padding:8px 6px;">${planPill(f.plan)}</td>
      <td style="padding:8px 6px;color:#94a3b8;font-size:12px;text-align:center;">${f.memberCount}</td>
      <td style="padding:8px 6px;color:#64748b;font-size:11px;">${esc(f.storageUsed)}</td>
      <td style="padding:8px 6px;color:#64748b;font-size:11px;">${esc(f.joinedAgo)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:28px 16px;">

  <!-- Header -->
  <tr><td style="padding-bottom:20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0;">🪺 FamilyNest</p>
          <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Daily Admin Report &middot; ${esc(stats.date)}</p>
        </td>
        <td style="text-align:right;">
          <a href="${appUrl}/admin" style="display:inline-block;background:#D4A843;color:#0f172a;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:12px;">View Dashboard →</a>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Platform KPIs -->
  ${sectionHeader("Platform Overview")}
  <tr><td>
    <table width="100%" cellpadding="4" cellspacing="4">
      <tr>
        ${statBlock("Families", stats.totalFamilies)}
        ${statBlock("Paid", stats.paidFamilies, `${stats.conversionPct}% conversion`)}
        ${statBlock("Members", stats.totalMembers, `${stats.membersWithAccounts} with login`)}
        ${statBlock("Storage", stats.totalStorageGB)}
      </tr>
    </table>
  </td></tr>

  <!-- Last 24 h -->
  ${sectionHeader("Last 24 Hours")}
  <tr><td>
    <table width="100%" cellpadding="4" cellspacing="4">
      <tr>
        ${statBlock("New Families", stats.newFamilies24h)}
        ${statBlock("New Members", stats.newMembers24h)}
        ${statBlock("Content Items", stats.newContent24h)}
      </tr>
    </table>
  </td></tr>

  <!-- Last 7 d -->
  ${sectionHeader("Last 7 Days")}
  <tr><td>
    <table width="100%" cellpadding="4" cellspacing="4">
      <tr>
        ${statBlock("New Families", stats.newFamilies7d, `${stats.newFamilies30d} in 30d`)}
        ${statBlock("New Members", stats.newMembers7d)}
        ${statBlock("Content Items", stats.newContent7d)}
      </tr>
    </table>
  </td></tr>

  <!-- Plan breakdown -->
  ${sectionHeader("Plans")}
  <tr><td style="background:#1e293b;border-radius:10px;padding:16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#94a3b8;font-size:12px;">Free</td>
              <td style="text-align:right;color:#e2e8f0;font-size:12px;font-weight:600;">${stats.freeFamilies}</td>
            </tr>
          </table>
          <div style="height:4px;background:#0f172a;border-radius:4px;margin-top:4px;">
            <div style="height:4px;background:#475569;border-radius:4px;width:${stats.totalFamilies > 0 ? Math.round((stats.freeFamilies / stats.totalFamilies) * 100) : 0}%;"></div>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#93c5fd;font-size:12px;">Annual — $79/yr</td>
              <td style="text-align:right;color:#e2e8f0;font-size:12px;font-weight:600;">${stats.annualFamilies}</td>
            </tr>
          </table>
          <div style="height:4px;background:#0f172a;border-radius:4px;margin-top:4px;">
            <div style="height:4px;background:#3b82f6;border-radius:4px;width:${stats.totalFamilies > 0 ? Math.round((stats.annualFamilies / stats.totalFamilies) * 100) : 0}%;"></div>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#fbbf24;font-size:12px;">Legacy — Lifetime</td>
              <td style="text-align:right;color:#e2e8f0;font-size:12px;font-weight:600;">${stats.legacyFamilies}</td>
            </tr>
          </table>
          <div style="height:4px;background:#0f172a;border-radius:4px;margin-top:4px;">
            <div style="height:4px;background:#f59e0b;border-radius:4px;width:${stats.totalFamilies > 0 ? Math.round((stats.legacyFamilies / stats.totalFamilies) * 100) : 0}%;"></div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Content library -->
  ${sectionHeader("Content Library (All-Time)")}
  <tr><td style="background:#1e293b;border-radius:10px;padding:16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ["📔 Journal Entries", stats.journalEntries],
        ["🖼️ Photos", stats.photos],
        ["📖 Stories", stats.stories],
        ["🎙️ Voice Memos", stats.voiceMemos],
        ["🍽️ Recipes", stats.recipes],
        ["📅 Events", stats.events],
        ["💌 Time Capsules", stats.timeCapsules],
        ["🏆 Achievements", stats.achievements],
        ["🎨 Artwork", stats.artwork],
      ]
        .map(
          ([label, count]) => `
      <tr>
        <td style="color:#94a3b8;font-size:12px;padding:5px 0;">${label}</td>
        <td style="text-align:right;color:#e2e8f0;font-size:12px;font-weight:600;">${Number(count).toLocaleString()}</td>
      </tr>`
        )
        .join("")}
      <tr>
        <td colspan="2" style="padding-top:10px;border-top:1px solid #334155;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#f1f5f9;font-size:13px;font-weight:600;">Total Items</td>
              <td style="text-align:right;color:#D4A843;font-size:14px;font-weight:700;">${stats.totalContentItems.toLocaleString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Families table -->
  ${sectionHeader(`All Families (${stats.families.length})`)}
  <tr><td style="background:#1e293b;border-radius:10px;padding:4px 0;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr style="background:#0f172a;">
        <th style="color:#64748b;font-size:10px;text-transform:uppercase;padding:8px 10px;text-align:left;font-weight:600;">Family</th>
        <th style="color:#64748b;font-size:10px;text-transform:uppercase;padding:8px 6px;text-align:left;font-weight:600;">Plan</th>
        <th style="color:#64748b;font-size:10px;text-transform:uppercase;padding:8px 6px;text-align:center;font-weight:600;">Members</th>
        <th style="color:#64748b;font-size:10px;text-transform:uppercase;padding:8px 6px;text-align:left;font-weight:600;">Storage</th>
        <th style="color:#64748b;font-size:10px;text-transform:uppercase;padding:8px 6px;text-align:left;font-weight:600;">Joined</th>
      </tr>
      ${familyRows}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:24px;text-align:center;">
    <p style="color:#334155;font-size:11px;margin:0;">
      FamilyNest Admin &middot; <a href="${appUrl}/admin" style="color:#64748b;">View live dashboard</a>
    </p>
    <p style="color:#1e293b;font-size:10px;margin:6px 0 0;">
      This report is sent daily at 7:00 AM UTC.
    </p>
  </td></tr>

</table>
</body>
</html>`;
}
