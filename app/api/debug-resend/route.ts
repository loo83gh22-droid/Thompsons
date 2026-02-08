import { NextResponse } from "next/server";

/** Debug endpoint to verify RESEND_API_KEY is available in production. Remove after debugging. */
export async function GET() {
  const hasKey = !!process.env.RESEND_API_KEY;
  return NextResponse.json({
    resendConfigured: hasKey,
    env: process.env.NODE_ENV,
  });
}
