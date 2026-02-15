import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/src/lib/supabase/server';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { email, name, familyId } = await request.json();

    const supabase = await createClient();

    // Get family member ID
    const { data: member } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('family_id', familyId)
      .single();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .checklist { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .checklist-item { margin: 10px 0; padding-left: 25px; position: relative; }
            .checklist-item:before { content: "✓"; position: absolute; left: 0; color: #0ea5e9; font-weight: bold; }
            .cta { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏡 Welcome to Our Family Nest, ${name}!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We're thrilled to have you here! Your Family Nest is ready, and we can't wait to see the memories you'll preserve.</p>

              <div class="checklist">
                <h3>Get Started in 3 Easy Steps:</h3>
                <div class="checklist-item">Add your first family member (or they add themselves!)</div>
                <div class="checklist-item">Upload your favorite family photo</div>
                <div class="checklist-item">Write one sentence about that moment</div>
              </div>

              <p>That's it! In less than 5 minutes, you'll have started your family's digital heirloom.</p>

              <center>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/photos" class="cta">
                  📷 Upload Your First Photo
                </a>
              </center>

              <p style="margin-top: 30px;">Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/getting-started">Quick Start Guide</a>.</p>

              <p>Welcome to the family,<br>The Our Family Nest Team</p>
            </div>
            <div class="footer">
              <p>Our Family Nest • Preserving memories, one family at a time</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Our Family Nest <notifications@resend.dev>',
      to: email,
      subject: 'Welcome to Our Family Nest! 🏡',
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending welcome email:', emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    // Track email sent
    if (member) {
      await supabase.from('email_campaigns').insert({
        family_member_id: member.id,
        campaign_type: 'welcome',
      });
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });
  } catch (error: any) {
    console.error('Error in send-welcome:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
