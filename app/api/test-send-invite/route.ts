import { NextResponse } from "next/server";
import { Resend } from "resend";

/** Debug: send a test invite email. GET ?to=your@email.com - Remove after debugging. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to")?.trim();
  if (!to) {
    return NextResponse.json({ error: "Add ?to=your@email.com" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Thompsons <onboarding@resend.dev>";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const signupUrl = baseUrl ? `${baseUrl}/login` : null;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Test: You've been added to Our Family!",
    html: `
      <h2>Test invite</h2>
      <p>If you got this, Resend is working.</p>
      ${signupUrl ? `<p><a href="${signupUrl}">Sign up</a></p>` : ""}
    `,
  });

  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: data?.id });
}
