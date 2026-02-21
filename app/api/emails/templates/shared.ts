/**
 * Shared utilities for all email templates.
 */

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://localhost:3000");

/** Escape HTML special characters to prevent injection in email content. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Standard email footer with unsubscribe link. */
export function emailFooter(): string {
  return `<tr><td style="text-align:center;padding-top:24px;">
  <p style="color:#64748b;font-size:12px;margin:0;">Family Nest &middot; <a href="${appUrl}/dashboard/settings" style="color:#64748b;">Manage notifications</a></p>
  <p style="color:#475569;font-size:11px;margin:8px 0 0;">
    <a href="${appUrl}/dashboard/settings" style="color:#475569;text-decoration:underline;">Unsubscribe</a> from these emails
  </p>
</td></tr>`;
}

/** Outer email wrapper — consistent dark theme. */
export function emailWrapper(body: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
${body}
${emailFooter()}
</table></body></html>`;
}

/** Standard card wrapper. */
export function card(content: string): string {
  return `<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">${content}</td></tr>`;
}

/** Gold CTA button. */
export function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>`;
}

export { appUrl };
