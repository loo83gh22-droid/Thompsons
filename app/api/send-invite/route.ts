import { NextResponse } from "next/server";
import { Resend } from "resend";

/** Internal: send invite email. Called from server actions. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, name, familyName } = body as { to: string; name: string; familyName: string };
    if (!to?.trim()) {
      return NextResponse.json({ error: "Missing to" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "Thompsons <onboarding@resend.dev>";
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    const signupUrl = baseUrl ? `${baseUrl}/login` : null;

    const { data, error } = await resend.emails.send({
      from,
      to: to.trim(),
      subject: `You've been added to ${familyName || "Our Family"}!`,
      html: `
        <h2>You've been added to ${(familyName || "Our Family").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
        <p>Hi${name?.trim() ? ` ${name.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}` : ""},</p>
        <p>Someone has added you to their family on Our Family Nest. Sign up to join and see photos, memories, and more.</p>
        ${signupUrl ? `<p><a href="${signupUrl}" style="display: inline-block; background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Sign up to join</a></p>` : ""}
        <p style="margin-top: 24px; color: #888; font-size: 12px;">
          If you didn't expect this, you can ignore this email.
        </p>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
