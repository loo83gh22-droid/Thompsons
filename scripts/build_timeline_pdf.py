"""
Build the FamilyNest session-build timeline as a PDF.

Run:
    python scripts/build_timeline_pdf.py

Output:
    docs/FamilyNest_Build_Timeline_2026-05.pdf
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
)

OUTPUT = "docs/FamilyNest_Build_Timeline_2026-05.pdf"

# ── Brand colors (approx. matched to FamilyNest theme) ───────────────────
FOREST = HexColor("#3D6B5E")     # primary green
ACCENT = HexColor("#C47C3A")     # warm accent / CTA orange
MUTED = HexColor("#64748B")
INK = HexColor("#1A202C")
BG_PANEL = HexColor("#F5EFE6")   # warm cream
BG_ALT = HexColor("#FBF7F1")
RULE = HexColor("#E2D9CC")

# ── Styles ───────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "Title", parent=styles["Title"],
    fontName="Times-Bold", fontSize=32, leading=38,
    textColor=INK, alignment=TA_LEFT, spaceAfter=8,
)

subtitle_style = ParagraphStyle(
    "Subtitle", parent=styles["Normal"],
    fontName="Helvetica", fontSize=14, leading=20,
    textColor=MUTED, spaceAfter=20,
)

kicker_style = ParagraphStyle(
    "Kicker", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=10, leading=12,
    textColor=ACCENT, spaceAfter=4,
)

h1_style = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontName="Times-Bold", fontSize=22, leading=28,
    textColor=INK, spaceBefore=16, spaceAfter=10,
)

h2_style = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontName="Times-Bold", fontSize=16, leading=20,
    textColor=FOREST, spaceBefore=14, spaceAfter=6,
)

h3_style = ParagraphStyle(
    "H3", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=12, leading=16,
    textColor=INK, spaceBefore=8, spaceAfter=4,
)

body_style = ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10.5, leading=16,
    textColor=INK, spaceAfter=8,
)

bullet_style = ParagraphStyle(
    "Bullet", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10.5, leading=16,
    textColor=INK, leftIndent=14, bulletIndent=4, spaceAfter=4,
)

caption_style = ParagraphStyle(
    "Caption", parent=styles["Normal"],
    fontName="Helvetica-Oblique", fontSize=9, leading=13,
    textColor=MUTED, spaceAfter=4,
)

pr_label_style = ParagraphStyle(
    "PRLabel", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=10, leading=14,
    textColor=ACCENT,
)


def section_rule():
    """A simple horizontal rule via a 1-row table."""
    t = Table([[""]], colWidths=[6.5 * inch], rowHeights=[1])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE),
    ]))
    return t


def pr_block(pr_num, title, body_lines):
    """Render a PR entry as a 2-col table: PR# | description."""
    body_paragraphs = [Paragraph(f"<b>{title}</b>", body_style)]
    for line in body_lines:
        body_paragraphs.append(Paragraph(line, bullet_style))

    pr_cell = Paragraph(f"<b>PR&nbsp;#{pr_num}</b>", pr_label_style)

    t = Table(
        [[pr_cell, body_paragraphs]],
        colWidths=[0.85 * inch, 5.65 * inch],
    )
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return KeepTogether(t)


def themed_panel(title, content_paragraphs, bg=BG_PANEL):
    """A subtle panel for callouts."""
    cell_content = [Paragraph(f"<b>{title}</b>", h3_style)] + content_paragraphs
    t = Table(
        [[cell_content]],
        colWidths=[6.5 * inch],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


# ── Document content ─────────────────────────────────────────────────────
def build_story():
    s = []

    # ── COVER ────────────────────────────────────────────────────────────
    s.append(Spacer(1, 1.4 * inch))
    s.append(Paragraph("FamilyNest", kicker_style))
    s.append(Paragraph("Build Timeline", title_style))
    s.append(Paragraph("Site quality review through gift purchase flow", subtitle_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.4 * inch))
    s.append(Paragraph("Session window", h3_style))
    s.append(Paragraph("April&nbsp;23 — May&nbsp;15, 2026", body_style))
    s.append(Spacer(1, 0.15 * inch))
    s.append(Paragraph("Scope", h3_style))
    s.append(Paragraph(
        "Eighteen pull requests across three weeks. Started as a real "
        "site-quality review of familynest.io. Ended with a "
        "buyer-to-recipient gift purchase flow live in production.",
        body_style,
    ))
    s.append(Spacer(1, 0.15 * inch))
    s.append(Paragraph("Strategic pivots", h3_style))
    s.append(Paragraph(
        "Audience explicitly narrowed to tight-knit nuclear families "
        "(parents + kids) — not extended/multi-generational. Gift-givers "
        "kept as a kept persona despite the pivot.",
        body_style,
    ))
    s.append(PageBreak())

    # ── EXECUTIVE SUMMARY ────────────────────────────────────────────────
    s.append(Paragraph("WHAT CHANGED", kicker_style))
    s.append(Paragraph("Executive summary", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Public landing page", h3_style))
    s.append(Paragraph(
        "From a wall of features and three buttons saying different things "
        "to a phone-first hero, three lead features (Journal / Voice Memos / "
        "Time Capsules) with an opt-in expander for the rest, and a single "
        "consistent CTA — <b>Start Your Family Nest</b> — across the whole "
        "site.",
        body_style,
    ))

    s.append(Paragraph("Signed-in dashboard", h3_style))
    s.append(Paragraph(
        "Weekly Streak (off-brand: app sells itself as <i>not social "
        "media</i>) removed. The intrusive purple Quick Actions popover "
        "deleted. Four small competing widgets below 'In the Nest' collapsed "
        "into a single rotating <b>Serendipity Card</b>. Nav dropdowns now "
        "have grouped section headers so power-user families like Thompson "
        "can still scan quickly.",
        body_style,
    ))

    s.append(Paragraph("New user defaults", h3_style))
    s.append(Paragraph(
        "Default feature seed for new families trimmed from 10 add-ons to "
        "3 (voice memos, family letters, traditions). Onboarding "
        "checklist now nudges <i>write-first</i> instead of "
        "<i>invite-others-first</i>. WelcomeModal no longer auto-opens "
        "and block the dashboard.",
        body_style,
    ))

    s.append(Paragraph("Gift purchase flow", h3_style))
    s.append(Paragraph(
        "Built from scratch over four PRs. Replaces the 'wrap your own "
        "login on a card' workaround with a real flow: buyer pays as "
        "guest → Stripe webhook persists a <i>pending_gifts</i> row → "
        "recipient gets an email → recipient sets their own password "
        "and owns a Legacy Nest from day one. Buyer also gets a "
        "<i>they opened your gift</i> notification.",
        body_style,
    ))

    s.append(Paragraph("Infrastructure", h3_style))
    s.append(Paragraph(
        "Two important truthing changes: CLAUDE.md updated to admit CI "
        "doesn't auto-apply migrations (it doesn't — a manual MCP step "
        "is required), and a billing/plan enforcement re-audit confirmed "
        "no new findings and no regressions since the previous audit.",
        body_style,
    ))

    s.append(PageBreak())

    # ── TIMELINE ─────────────────────────────────────────────────────────
    s.append(Paragraph("PR BY PR", kicker_style))
    s.append(Paragraph("The build, chronologically", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.2 * inch))

    s.append(Paragraph("Weeks 1–2 — Site quality review &amp; simplification", h2_style))

    s.append(pr_block("113", "Landing simplification", [
        "&bull; Phone-first hero mockup (mobile-first product).",
        "&bull; &quot;See more features&quot; expander: lead with 3, expand to 6.",
        "&bull; Unified primary CTA across the site.",
        "&bull; Removed duplicate <i>Family Media. Not Social Media.</i> pill.",
    ]))

    s.append(pr_block("114", "Dashboard simplification", [
        "&bull; Killed the Weekly Streak widget (off-brand).",
        "&bull; Removed the intrusive purple Quick Actions popover.",
        "&bull; Relabeled left-edge music tab to <i>Playlist</i>.",
        "&bull; Cream placeholder background on photo tiles.",
    ]))

    s.append(pr_block("116", "Memories consolidation", [
        "&bull; Removed One Line A Day entirely.",
        "&bull; Demoted Letters from core nav to opt-in catalog item.",
        "&bull; Backfill migration so existing families don&apos;t lose Letters.",
    ]))

    s.append(pr_block("117", "Hotfix: <i>journal_perspectives.author_id</i>", [
        "&bull; Pre-existing 400 query (column is <i>family_member_id</i>).",
        "&bull; Silently failed for months; surfaced during deeper review.",
    ]))

    s.append(pr_block("118", "Hotfix: journal entry page crashed on every load", [
        "&bull; Server component passing inline arrow function to client component.",
        "&bull; Fixed with <i>serverAction.bind(null, id)</i> pattern.",
    ]))

    s.append(pr_block("119", "Nav reorg + pricing copy", [
        "&bull; Grouped section headers inside every dropdown.",
        "&bull; Items moved to honest homes (Time Capsules → Memories, etc.).",
        "&bull; Extras dropdown deleted; Feature Catalog moved to avatar menu.",
        "&bull; Full Nest pricing description rewritten.",
    ]))

    s.append(pr_block("120", "Serendipity card", [
        "&bull; Four secondary home widgets collapsed into one rotating card.",
        "&bull; Day-seed picks Memory of the Day / On This Day / Gratitude / Inspiration.",
    ]))

    s.append(pr_block("121", "Default-seed reduction", [
        "&bull; New families seeded with 3 features instead of 10.",
        "&bull; Existing families unaffected.",
    ]))

    s.append(pr_block("122", "Onboarding tone + sequence", [
        "&bull; Inverted checklist order: <b>write first</b>, then photo, then invite.",
        "&bull; SerendipityCard tips rewritten in permission-granting tone.",
    ]))

    s.append(pr_block("123", "WelcomeModal deferred", [
        "&bull; No longer auto-opens on first dashboard load.",
        "&bull; 🎨 Pick a theme link added to avatar menu instead.",
    ]))

    s.append(pr_block("124", "ActivityFeed empty state polish", [
        "&bull; Aligned with the new onboarding flow tone.",
        "&bull; Added voice-memo CTA to match body copy.",
    ]))

    s.append(pr_block("125", "Gift flow copy tighten", [
        "&bull; Step 3 credentials guidance made explicit.",
        "&bull; Removed misleading <i>Transfer ownership</i> bullet.",
        "&bull; 🎁 banner on <i>/login?mode=signup&amp;plan=legacy_founding</i>.",
    ]))

    s.append(PageBreak())

    s.append(Paragraph("Week 3 — Infrastructure &amp; audits", h2_style))

    s.append(pr_block("126", "Migration workflow honesty", [
        "&bull; CLAUDE.md corrected: CI does <b>not</b> auto-apply migrations.",
        "&bull; <i>scripts/check-pending-migrations.sh</i> guard added.",
        "&bull; Disabled CI workflow left in place (reconciliation is 4–6h project).",
    ]))

    s.append(pr_block("127", "Billing re-audit (2026-05-05)", [
        "&bull; Re-audit covering changes since 2026-04-05.",
        "&bull; <b>Zero new findings, zero regressions.</b>",
        "&bull; Snapshot at <i>docs/BILLING_AUDIT_2026-05-05.md</i>.",
    ]))

    s.append(Paragraph("Week 3 — Gift purchase flow", h2_style))

    s.append(pr_block("128", "Phase A — schema + design doc", [
        "&bull; Migration: <i>pending_gifts</i> table (applied via Supabase MCP).",
        "&bull; <i>docs/GIFT_FLOW_DESIGN.md</i> with 6 open questions resolved.",
        "&bull; Refund policy locked in §7 of the design doc.",
    ]))

    s.append(pr_block("129", "Phase B — buyer flow", [
        "&bull; <i>/gift/buy</i> form (recipient → message → buyer fieldsets).",
        "&bull; <i>/api/gift/checkout</i> Stripe session with gift metadata.",
        "&bull; <i>/gift/sent</i> confirmation page.",
        "&bull; No auth required — buyer pays as a guest.",
    ]))

    s.append(pr_block("130", "Phase C — webhook + emails", [
        "&bull; Gift branch at top of <i>checkout.session.completed</i>.",
        "&bull; Early-return so self-purchase flow is never touched.",
        "&bull; Idempotent on <i>stripe_session_id</i> unique constraint.",
        "&bull; Recipient + buyer emails via Resend.",
    ]))

    s.append(pr_block("131", "Phase D — recipient redemption", [
        "&bull; <i>/gift/claim/[token]</i> server-rendered page with 4 states.",
        "&bull; <i>/api/gift/claim</i> creates auth user + family + applies plan.",
        "&bull; New-user and existing-user paths both supported.",
        "&bull; Buyer&apos;s <i>they opened your gift</i> email closes the loop.",
    ]))

    s.append(Spacer(1, 0.2 * inch))
    s.append(themed_panel(
        "What the gift flow delivers",
        [
            Paragraph(
                "A buyer fills <i>/gift/buy</i>, pays via Stripe, recipient "
                "gets an email titled <i>&ldquo;[Buyer] gave you a Family "
                "Nest&rdquo;</i>, clicks the link, sets a password, and "
                "owns a Legacy Nest with 10 GB storage from day one. No "
                "login sharing. No mental gymnastics. No ownership "
                "transfer fine print.",
                body_style,
            ),
        ],
    ))

    s.append(PageBreak())

    # ── STRATEGIC DECISIONS ──────────────────────────────────────────────
    s.append(Paragraph("DECISIONS THAT STICK", kicker_style))
    s.append(Paragraph("Strategic choices locked this session", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Audience: tight-knit nuclear families", h3_style))
    s.append(Paragraph(
        "Parents + kids. Not extended/multi-generational, not "
        "grandparent-gifters. This pivot shaped the default-seed "
        "reduction, the onboarding sequence, and the SerendipityCard "
        "copy. The pivot is captured in <i>memory/project_target_audience.md</i> "
        "for the next session to remember.",
        body_style,
    ))

    s.append(Paragraph("Gift-givers persona stays", h3_style))
    s.append(Paragraph(
        "Despite the nuclear-family pivot, the user explicitly kept the "
        "gift-givers persona on the landing page. The full gift "
        "purchase flow is a direct consequence of that decision.",
        body_style,
    ))

    s.append(Paragraph("Pricing tiers stay as-is", h3_style))
    s.append(Paragraph(
        "Free / Full Nest $6.99 monthly / Legacy $249–$349 one-time. "
        "When offered the option to drop the middle tier, the user "
        "declined. The Full Nest description was rewritten to "
        "differentiate clearly.",
        body_style,
    ))

    s.append(Paragraph("Refund policy", h3_style))
    s.append(Paragraph(
        "<i>&ldquo;Gifts are refundable any time before the recipient "
        "redeems them. After redemption, all sales are final.&rdquo;</i> "
        "Manual via Stripe dashboard for v1 — no self-serve refund UI. "
        "Policy surfaced on the <i>/gift/buy</i> form.",
        body_style,
    ))

    s.append(Paragraph("Migration workflow: MCP, not CI", h3_style))
    s.append(Paragraph(
        "CI workflow is intentionally disabled. Apply migrations via "
        "Supabase MCP <i>apply_migration</i> before merging any PR with "
        "new SQL files. Reconciling the existing version drift is a "
        "4–6 hour cleanup with real risk — not worth doing without a "
        "clear plan.",
        body_style,
    ))

    s.append(PageBreak())

    # ── OUTSTANDING WORK ─────────────────────────────────────────────────
    s.append(Paragraph("STILL OPEN", kicker_style))
    s.append(Paragraph("Outstanding &amp; parked", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.15 * inch))

    s.append(themed_panel(
        "🚨 Real-money production gift-flow test",
        [
            Paragraph(
                "The gift flow is shipped and live but has not yet been "
                "exercised with real Stripe + real Resend emails. A "
                "walkthrough exists in chat (6 steps: visit /gift, pay "
                "$249, verify 3 emails, redeem, verify buyer-opened "
                "email, refund self via Stripe dashboard). This is the "
                "<b>top priority</b> for whoever picks this up next.",
                body_style,
            ),
        ],
        bg=BG_ALT,
    ))

    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Phase E polish — partially done", h3_style))
    s.append(Paragraph(
        "&bull; ✅ GiftWelcomeBanner on the dashboard for <i>?welcome=gift</i> "
        "— already in the repo.",
        body_style,
    ))
    s.append(Paragraph(
        "&bull; ⏳ Printable gift card view (with print-specific CSS) "
        "— not built.",
        body_style,
    ))
    s.append(Paragraph(
        "&bull; ⏳ &quot;View your sent gifts&quot; page for buyers — never started, low priority.",
        body_style,
    ))

    s.append(Paragraph("Other backlog (priority order)", h3_style))
    s.append(Paragraph("&bull; Onboarding flow audit — partial wins shipped; still room.", body_style))
    s.append(Paragraph("&bull; Performance pass — /speed-review skill exists, never run.", body_style))
    s.append(Paragraph("&bull; /blog and /contact page audits — never looked.", body_style))
    s.append(Paragraph("&bull; KPI/analytics for the UX changes shipped this session.", body_style))
    s.append(Paragraph("&bull; G7 (long-standing) — client-side upload pre-gating in 5 modules.", body_style))
    s.append(Paragraph("&bull; Re-enable CI migration workflow — 4–6 hour reconciliation.", body_style))

    s.append(PageBreak())

    # ── CLOSING ──────────────────────────────────────────────────────────
    s.append(Paragraph("WHERE TO PICK UP", kicker_style))
    s.append(Paragraph("Cold-start guide for the next session", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph(
        "Read <i>docs/SESSION_HANDOFF.md</i> first — it&apos;s the canonical "
        "single page that captures everything in this PDF plus the "
        "specific gotchas that bit us. The PDF is for human storytelling; "
        "the markdown is for the model.",
        body_style,
    ))

    s.append(Paragraph(
        "Then open with: &ldquo;Did the real-money gift flow test "
        "happen? If yes — what worked, what didn&apos;t? If no — let me "
        "know if you want to walk through it, or pick from the parked "
        "backlog above.&rdquo;",
        body_style,
    ))

    s.append(Spacer(1, 0.5 * inch))

    s.append(themed_panel(
        "Files to know about",
        [
            Paragraph("<b>docs/SESSION_HANDOFF.md</b> — cold-start handoff doc.", body_style),
            Paragraph("<b>docs/GIFT_FLOW_DESIGN.md</b> — gift flow architecture.", body_style),
            Paragraph("<b>docs/BILLING_FINDINGS.md</b> — canonical billing audit log.", body_style),
            Paragraph("<b>docs/BILLING_AUDIT_2026-05-05.md</b> — most recent audit snapshot.", body_style),
            Paragraph("<b>scripts/check-pending-migrations.sh</b> — pre-merge SQL guard.", body_style),
            Paragraph("<b>memory/project_target_audience.md</b> — audience pivot note.", body_style),
            Paragraph("<b>CLAUDE.md</b> — Database Migrations section has the canonical workflow.", body_style),
        ],
    ))

    return s


def main():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title="FamilyNest Build Timeline — April–May 2026",
        author="Family Nest",
        subject="Session build summary",
    )
    doc.build(build_story())
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
