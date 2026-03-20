import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/src/lib/supabase/admin';

/**
 * POST /api/claude-inbox
 *
 * Receives inbound email webhooks from Resend when Rob replies to a
 * Claude Code notification email. Stores the reply in claude_inbox so
 * the local poll-inbox.mjs script can pick it up.
 *
 * Protected by a shared token in the query string:
 *   ?token=CLAUDE_INBOX_TOKEN
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token || token !== process.env.CLAUDE_INBOX_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Resend inbound email payload fields
  const from = typeof body.from === 'string' ? body.from : '';
  const subject = typeof body.subject === 'string' ? body.subject : '';
  const rawText = typeof body.text === 'string' ? body.text : '';

  // Strip quoted reply lines (lines starting with ">") and trim
  const replyText = rawText
    .split('\n')
    .filter((line: string) => !line.startsWith('>') && !line.match(/^On .+ wrote:$/))
    .join('\n')
    .trim();

  if (!replyText) {
    return NextResponse.json({ ok: true, note: 'Empty reply after stripping quotes' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('claude_inbox').insert({
    from_email: from,
    reply_text: replyText,
    subject,
  });

  if (error) {
    console.error('[claude-inbox] Supabase error:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
