"""
Build the FamilyNest full-build timeline as a PDF.

Covers the entire build arc from initial commit (2026-02-05) through
the current session end (2026-05-16). 132 merged PRs across 3 months
grouped into 5 phases.

Run:
    python scripts/build_timeline_pdf.py

Output:
    docs/FamilyNest_Build_Timeline.pdf
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
)

OUTPUT = "docs/FamilyNest_Build_Timeline.pdf"

# ── Brand colors ────────────────────────────────────────────────────────
FOREST = HexColor("#3D6B5E")
ACCENT = HexColor("#C47C3A")
MUTED = HexColor("#64748B")
INK = HexColor("#1A202C")
BG_PANEL = HexColor("#F5EFE6")
BG_ALT = HexColor("#FBF7F1")
RULE = HexColor("#E2D9CC")

# ── Styles ──────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "Title", parent=styles["Title"],
    fontName="Times-Bold", fontSize=34, leading=40,
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
    fontName="Times-Bold", fontSize=24, leading=30,
    textColor=INK, spaceBefore=16, spaceAfter=10,
)
h2_style = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontName="Times-Bold", fontSize=18, leading=22,
    textColor=FOREST, spaceBefore=16, spaceAfter=6,
)
h3_style = ParagraphStyle(
    "H3", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=12, leading=16,
    textColor=INK, spaceBefore=10, spaceAfter=4,
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
small_style = ParagraphStyle(
    "Small", parent=styles["Normal"],
    fontName="Helvetica", fontSize=9, leading=13,
    textColor=MUTED, spaceAfter=4,
)
stat_label_style = ParagraphStyle(
    "StatLabel", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=9, leading=12,
    textColor=MUTED, spaceAfter=2,
)
stat_value_style = ParagraphStyle(
    "StatValue", parent=styles["Normal"],
    fontName="Times-Bold", fontSize=24, leading=28,
    textColor=ACCENT, spaceAfter=4,
)


def section_rule():
    t = Table([[""]], colWidths=[6.5 * inch], rowHeights=[1])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE)]))
    return t


def themed_panel(title, paragraphs, bg=BG_PANEL):
    cell = [Paragraph(f"<b>{title}</b>", h3_style)] + paragraphs
    t = Table([[cell]], colWidths=[6.5 * inch])
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


def stats_row(items):
    """4-column row of headline stats."""
    cells = []
    for label, value in items:
        cells.append([
            Paragraph(value, stat_value_style),
            Paragraph(label, stat_label_style),
        ])
    t = Table([cells], colWidths=[1.625 * inch] * 4)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def phase_header(phase_num, date_range, title):
    """Big phase divider."""
    t = Table(
        [[
            [
                Paragraph(f"PHASE {phase_num}", kicker_style),
                Paragraph(title, h1_style),
                Paragraph(date_range, small_style),
            ]
        ]],
        colWidths=[6.5 * inch],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_PANEL),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    return t


def pr_row(pr_num, title, note=None):
    """One line summarizing a PR."""
    text = f"<b>#{pr_num}</b> &nbsp; {title}"
    if note:
        text += f"<br/><font color='#64748B' size='9'>{note}</font>"
    return Paragraph(text, bullet_style)


# ── Document content ─────────────────────────────────────────────────────
def build_story():
    s = []

    # ── COVER ────────────────────────────────────────────────────────────
    s.append(Spacer(1, 1.2 * inch))
    s.append(Paragraph("FamilyNest", kicker_style))
    s.append(Paragraph("The Build", title_style))
    s.append(Paragraph(
        "From initial commit to a private family memory app with a real gift purchase flow.",
        subtitle_style,
    ))
    s.append(section_rule())
    s.append(Spacer(1, 0.5 * inch))

    s.append(stats_row([
        ("First commit", "Feb 5"),
        ("This snapshot", "May 16"),
        ("PRs merged", "132"),
        ("Total commits", "691"),
    ]))
    s.append(Spacer(1, 0.45 * inch))

    s.append(Paragraph("What you&apos;re reading", h3_style))
    s.append(Paragraph(
        "Three months of work, told as a story. Five phases, from the first "
        "stubbed family-member card to a live buyer-pays-then-recipient-"
        "redeems Stripe gift flow. Each phase ends with what shipped, what "
        "the inflection point was, and where the next phase picked up.",
        body_style,
    ))
    s.append(Spacer(1, 0.15 * inch))
    s.append(Paragraph("How to read it", h3_style))
    s.append(Paragraph(
        "Cover to cover takes about ten minutes. The phase headers tell you "
        "the date range and the headline. The PR lists under each are the "
        "real artifacts — every one is a merged pull request you can find "
        "on GitHub if you want to dig in. The final pages capture strategic "
        "decisions that shaped the build and the things still open.",
        body_style,
    ))
    s.append(PageBreak())

    # ── BIG PICTURE ──────────────────────────────────────────────────────
    s.append(Paragraph("THE BIG PICTURE", kicker_style))
    s.append(Paragraph("Five phases in three months", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.2 * inch))

    s.append(Paragraph("Phase 1 &middot; Foundations &middot; Feb 5 – Mar 1", h3_style))
    s.append(Paragraph(
        "First commit. Auth wired up. Member cards designed and redesigned. "
        "A privacy audit closes 9 findings before the project has a hundred "
        "users. The product takes its name, &ldquo;Family Nest,&rdquo; and "
        "the first family invite emails go out.",
        body_style,
    ))

    s.append(Paragraph("Phase 2 &middot; Core features &middot; Mar 8 – Mar 13", h3_style))
    s.append(Paragraph(
        "Bucket lists. Voice memos with optional photo. The first plan tiers "
        "(free / paid). A storage-bucket hardening to close a CDN bypass. "
        "Speed work — parallel uploads, image compression — when uploads "
        "start choking on phones. The first comprehensive audit-fix day "
        "(privacy, billing, data integrity, performance — four PRs landed "
        "the same Friday).",
        body_style,
    ))

    s.append(Paragraph("Phase 3 &middot; Feature Catalog &middot; Mar 14 – Mar 28", h3_style))
    s.append(Paragraph(
        "The architectural pivot. Instead of bolting features onto a flat "
        "nav, introduce a Feature Catalog: every feature is opt-in per "
        "family. The dashboard gets themes. The pricing model gets a "
        "monthly tier and a Mother&apos;s Day founding rate. By the end of "
        "the phase, fifteen new features (Reunion Planner, MLB Stadium "
        "Tour, Baby Book, Quotes, Awards Night, Game Night, Garden, "
        "Volunteer, Films, Homes, Teams, Family Book Club, Gratitude "
        "Board, Family Motto, Stories) have shipped behind the catalog.",
        body_style,
    ))

    s.append(Paragraph("Phase 4 &middot; Tight family pivot &middot; Mar 29 – Apr 12", h3_style))
    s.append(Paragraph(
        "Audience explicitly reframed from &ldquo;multi-generational&rdquo; "
        "to &ldquo;tight family.&rdquo; A new Letters feature lets parents "
        "write to kids. The homepage gets a complete copy rewrite. A "
        "Mother&apos;s Day campaign goes out — Legacy founding rate at $249. "
        "Legal docs, security hardening (S15, S16, C6), and a UX flow audit "
        "(UX1–UX12) close out the pre-launch hardening pass.",
        body_style,
    ))

    s.append(Paragraph("Phase 5 &middot; Quality review &amp; gift flow &middot; Apr 23 – May 16", h3_style))
    s.append(Paragraph(
        "The most recent session. A real walkthrough of familynest.io as a "
        "user. Eighteen PRs to simplify the landing and dashboard. A "
        "billing/plan re-audit comes back clean. A full buyer-pays-then-"
        "recipient-redeems gift purchase flow gets designed, built, and "
        "shipped across four phases. The product now sells gifts as gifts "
        "— not as &ldquo;wrap a login on a card.&rdquo;",
        body_style,
    ))

    s.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 1: Foundations
    # ─────────────────────────────────────────────────────────────────────
    s.append(phase_header(1, "February 5 – March 1, 2026", "Foundations"))
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph(
        "The product is born. Rob commits the initial code base on a "
        "Thursday afternoon — a Next.js scaffold with Supabase auth, basic "
        "middleware, and the bones of a family-members system. Within "
        "two days the public landing page is up and the first sign-up "
        "completes. Most of this phase is foundations work that doesn&apos;t "
        "ship through pull requests — direct main commits, the messy way "
        "things start.",
        body_style,
    ))
    s.append(Paragraph(
        "The phase ends with the first formal Privacy Hardening audit: "
        "nine findings (2 critical, 4 high, 3 medium) fixed in a single PR "
        "before the project has any real user volume. Setting a pattern "
        "that holds for the rest of the build — audit, fix, ship.",
        body_style,
    ))

    s.append(Paragraph("What shipped", h3_style))
    s.append(pr_row("2",  "Redesign member cards and fix pending invitation logic"))
    s.append(pr_row("3",  "Rename &lsquo;Our Family Nest&rsquo; to &lsquo;Family Nest&rsquo; sitewide"))
    s.append(pr_row("4",  "Redesign member cards with portrait layout"))
    s.append(pr_row("6",  "Fix: Add Member form opens as modal instead of pushing content down"))
    s.append(pr_row("7",  "Privacy hardening: 9 audit findings fixed (CRIT-2, HIGH-1/3/4/5, MED-1/3/6, CRIT-1)"))
    s.append(pr_row("8",  "Fix invited user signup creating spurious &lsquo;Our Family&rsquo; family"))

    s.append(themed_panel("Inflection point", [
        Paragraph(
            "The Feb 21 product rename from &ldquo;Our Family Nest&rdquo; to "
            "&ldquo;Family Nest&rdquo; — small change, big signal. The product "
            "stops being a Thompson-family-specific thing and becomes a "
            "platform anyone can use. The naming choice ripples forward: "
            "the URL, the email templates, the marketing voice all settle.",
            body_style,
        ),
    ]))
    s.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 2: Core features
    # ─────────────────────────────────────────────────────────────────────
    s.append(phase_header(2, "March 8 – March 13, 2026", "Core features"))
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph(
        "Six days, twenty-seven merged PRs. The product goes from &ldquo;a "
        "way to add family members&rdquo; to &ldquo;an app you can actually "
        "use.&rdquo; A Friday push lands the first Plan Tiers, Bucket "
        "Lists, the comms-pipeline fix (emails were silently failing), "
        "and a security hardening that closes a CDN bypass on storage "
        "buckets. Voice Memos get optional photo attachments. The mobile "
        "experience gets its first dedicated fix pass after photo uploads "
        "start crashing on iPhone.",
        body_style,
    ))
    s.append(Paragraph(
        "March 13 is the first formal audit-fixing day — four PRs land "
        "within hours of each other: privacy, billing, data integrity, "
        "performance v2. This pattern becomes the model for the rest of "
        "the build.",
        body_style,
    ))

    s.append(Paragraph("Key features added", h3_style))
    s.append(pr_row("10", "Add Family Bucket List"))
    s.append(pr_row("11", "fix(comms): resolve zero-email pipeline + add 4 missing touchpoints"))
    s.append(pr_row("14", "security: harden storage buckets — close CDN bypass"))
    s.append(pr_row("16", "feat(tiers): redesign plan limits, enforcement and pricing page"))
    s.append(pr_row("18", "feat(voice-memos): add optional photo attachment"))
    s.append(pr_row("23", "UX: photo-first voice memo flow"))
    s.append(pr_row("24", "SEO: Blog, OG image, and keyword meta title"))

    s.append(Paragraph("Speed &amp; mobile push (Mar 9–11)", h3_style))
    s.append(pr_row("25", "Fix pet photo upload timeout"))
    s.append(pr_row("27", "Parallelize file uploads for faster saving"))
    s.append(pr_row("28", "Speed optimizations: compression, progress, parallel queries"))
    s.append(pr_row("29", "Fix mobile crash when uploading photos"))

    s.append(Paragraph("Big upgrades (Mar 11–12)", h3_style))
    s.append(pr_row("31", "Landing page CRO: gift-forward copy &amp; persona section",
                    "First major investment in conversion-focused landing copy"))
    s.append(pr_row("33", "Journal enhancements: 20 photos, 5 videos, cover photo, card/grid views, person filter"))
    s.append(pr_row("34", "Add Meta Pixel tracking for Facebook ads"))
    s.append(pr_row("41", "Free tier: unlock all features with low instance limits",
                    "Switch from feature-gated free tier to limit-gated"))
    s.append(pr_row("42", "Data entry UX: voice dictation, quick capture, photo captions"))
    s.append(pr_row("44", "Add &lsquo;remembered&rsquo; members for those we hold in our hearts"))

    s.append(Paragraph("First audit-fixing day (Mar 13)", h3_style))
    s.append(pr_row("49", "Privacy audit: add family scoping, rate limiting, reduce signed URL"))
    s.append(pr_row("50", "Billing audit fixes: plan gates, storage tracking, family scoping"))
    s.append(pr_row("51", "Data integrity fixes v2: storage cleanup, upload rollback, FK on-delete"))
    s.append(pr_row("52", "Performance fixes v2: batch imports, memoize map, limit queries"))

    s.append(themed_panel("Inflection point", [
        Paragraph(
            "PR #41 — switching the free tier from &ldquo;some features "
            "locked&rdquo; to &ldquo;all features, low limits.&rdquo; That "
            "design decision shapes everything downstream: the Feature "
            "Catalog (Phase 3) only works because Free isn&apos;t gated on "
            "feature access, just usage volume.",
            body_style,
        ),
    ]))
    s.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 3: Feature Catalog
    # ─────────────────────────────────────────────────────────────────────
    s.append(phase_header(3, "March 14 – March 28, 2026", "Feature Catalog &amp; expansion"))
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph(
        "The architectural pivot that defines the product. Until now, every "
        "feature has been bolted onto a flat nav. Adding a feature meant "
        "adding a nav item — fine for five features, untenable at fifteen.",
        body_style,
    ))
    s.append(Paragraph(
        "PR #59–60 introduce the Feature Catalog: every non-core feature "
        "is opt-in per family via a settings page. The nav becomes "
        "dynamic. Suddenly the product can ship niche features (MLB "
        "Stadium Tour, Garden Log, Awards Night) without overwhelming "
        "every user. By the end of the phase, fifteen new features ship "
        "behind the catalog without making the nav feel bloated.",
        body_style,
    ))

    s.append(Paragraph("The catalog itself (Mar 18–19)", h3_style))
    s.append(pr_row("58", "Add Tools section with Reunion Planner"))
    s.append(pr_row("59", "Privacy copy, journal photos, and Feature Catalog system"))
    s.append(pr_row("60", "Feature Catalog: 6 new add-on features + nav overhaul",
                    "The architectural pivot itself"))
    s.append(pr_row("61", "MLB Stadium Tour + fully dynamic nav system"))
    s.append(pr_row("62", "Dashboard overhaul: themes, stats, plan badges, account deletion, landing page"))

    s.append(Paragraph("Pricing overhaul (Mar 20)", h3_style))
    s.append(pr_row("64", "Pricing overhaul: monthly billing, founding rate, unlimited free, 20 GB annual"))
    s.append(pr_row("65", "Pricing overhaul: monthly plan, founding rate, billing fixes, docs refresh"))
    s.append(pr_row("69", "Add Baby Book feature + marketing copy updates"))

    s.append(Paragraph("Multi-nest hardening (Mar 21)", h3_style))
    s.append(pr_row("78", "Add family_id to share photo insert + multi-nest audit"))
    s.append(pr_row("79", "Multi-nest hardening: explicit family checks"))
    s.append(pr_row("82", "Rich weekly family digest email"))

    s.append(Paragraph("Catalog expansion (Mar 25–27)", h3_style))
    s.append(pr_row("86", "Feature catalog: new categories + 7 features + Favourites filter fix"))
    s.append(pr_row("87", "Add Family Book Club and Family Challenges"))
    s.append(pr_row("88", "Family Motto, Gratitude Board, Ancestry Stories + catalog previews"))
    s.append(pr_row("89", "Batch: Security fixes, Annual Events, Time Capsule privacy, Nav redesign"))
    s.append(pr_row("90", "Add Family Media positioning across homepage",
                    "Brand line &ldquo;Family Media. Not Social Media.&rdquo; ships"))
    s.append(pr_row("91", "Security &amp; Privacy: IDOR fixes + signed URL hardening"))
    s.append(pr_row("92", "Add Our Teams feature"))
    s.append(pr_row("93", "Redesign Favourites: user-defined custom lists"))
    s.append(pr_row("94", "Add 8 new features: Quotes, Predictions, Awards Night, Homes, Films, Game Night, Volunteer, Garden"))

    s.append(themed_panel("Inflection point", [
        Paragraph(
            "PR #60 — the Feature Catalog. Without it, the product would "
            "have either capped at ~10 features or become unusable. With "
            "it, every family curates their own Nest, the nav stays lean "
            "by default, and shipping new features stops being a "
            "nav-redesign exercise. Every feature added since lives "
            "behind this system.",
            body_style,
        ),
    ]))
    s.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 4: Tight family pivot
    # ─────────────────────────────────────────────────────────────────────
    s.append(phase_header(4, "March 29 – April 12, 2026", "Tight family pivot &amp; launch prep"))
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph(
        "After three weeks of building broadly, the audience gets a "
        "deliberate narrowing. The pitch reorients around tight families "
        "— the people who actually use the product day-to-day — and away "
        "from multi-generational framing. The Letters feature ships "
        "specifically for this audience: parent-to-kid letters sealed for "
        "later.",
        body_style,
    ))
    s.append(Paragraph(
        "Mother&apos;s Day becomes the de facto launch moment. The Legacy "
        "plan gets a $249 founding rate (down from $349) with a "
        "countdown to May 10. Two homepage rewrites land in the same "
        "week. The drip email sequence gets reworked to match the new "
        "tight-family voice.",
        body_style,
    ))
    s.append(Paragraph(
        "The phase ends with the most thorough pre-launch hardening pass "
        "of the build — UX flow audit (UX1–UX12), legal docs, password "
        "reset fixes, member deletion safety, onboarding improvements, "
        "and a security pass closing S15, S16, and C6.",
        body_style,
    ))

    s.append(Paragraph("Audience reframe (Mar 29–30)", h3_style))
    s.append(pr_row("95",  "Add Family Contacts — share outside the nest without giving app access"))
    s.append(pr_row("96",  "Tight family retrofit: Letters feature + copy reframe",
                     "Pivot from multi-gen to tight-family framing"))
    s.append(pr_row("98",  "Homepage tight family rewrite + in-app onboarding overhaul"))
    s.append(pr_row("99",  "Voice memos copy + Our Story rewrite"))
    s.append(pr_row("100", "Mother&apos;s Day pricing: Legacy founding rate + storage reductions"))
    s.append(pr_row("101", "Fix drip email copy: tight family narrative + correct pricing"))
    s.append(pr_row("102", "Homepage copy pass: narrative, pricing, testimonials"))

    s.append(Paragraph("More features (Mar 31)", h3_style))
    s.append(pr_row("103", "Baby Book: month-by-month with age-matched prompts"))
    s.append(pr_row("104", "Add birthday to Family Contacts + auto-sync to events"))
    s.append(pr_row("105", "Remove Messages, add Tradition event type"))

    s.append(Paragraph("Pre-launch hardening (Apr 5–12)", h3_style))
    s.append(pr_row("106", "Fix audit items 1-4: photos, timeline filter, dev badge, voice memo"))
    s.append(pr_row("107", "Legal docs update + security hardening (S15, S16, C6)"))
    s.append(pr_row("108", "Onboarding improvements: clickable prompts, photo step, resend confirmation"))
    s.append(pr_row("110", "Delete confirmations, member deletion safety, and birthday event cleanup"))
    s.append(pr_row("111", "Fix password reset + all critical UX flow issues (UX1–UX12)"))
    s.append(pr_row("112", "Onboarding improvements, delete confirmations, dependency updates + DB indexes"))

    s.append(themed_panel("Inflection point", [
        Paragraph(
            "PR #96 — the tight family pivot. Until this point the product "
            "is trying to be everything to everyone: nuclear family, "
            "multi-gen family, grandparent gifters, parents with infants. "
            "After this PR the messaging narrows. The marketing copy gets "
            "sharper, the onboarding gets faster, and a feature (Letters) "
            "ships specifically for the chosen audience. The narrowing "
            "carries into Phase 5 explicitly.",
            body_style,
        ),
    ]))
    s.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 5: Quality + gift flow (this session)
    # ─────────────────────────────────────────────────────────────────────
    s.append(phase_header(5, "April 23 – May 16, 2026", "Quality review &amp; gift purchase flow"))
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph(
        "The most recent session. Eighteen PRs and three architectural "
        "shifts. It starts with a no-holds-barred walkthrough of "
        "familynest.io as a real visitor — landing first, then signed-in "
        "dashboard. The findings drive ten consecutive simplification "
        "PRs: phone-first hero, killed widgets, unified CTAs, grouped "
        "nav, default seed reduced from ten features to three.",
        body_style,
    ))
    s.append(Paragraph(
        "Mid-phase, an audience confirmation: nuclear families, not "
        "extended. The pivot from Phase 4 gets explicitly locked in via "
        "memory notes. The gift-givers persona is retained as the "
        "exception — and the result is a real buyer-pays-then-recipient-"
        "redeems gift purchase flow built in four phases (PR 128 → 131).",
        body_style,
    ))
    s.append(Paragraph(
        "A billing/plan enforcement re-audit comes back clean. The "
        "migration workflow gets documented honestly (CI doesn&apos;t "
        "auto-apply — never has). And the phase wraps with a session "
        "handoff doc and this PDF, so the next session can pick up cold.",
        body_style,
    ))

    s.append(Paragraph("Site simplification (Apr 23–29)", h3_style))
    s.append(pr_row("113", "Landing: simplify hero + features, unify CTAs, mobile-first"))
    s.append(pr_row("114", "Dashboard: kill Weekly Streak, remove intrusive popover, polish"))
    s.append(pr_row("116", "Memories: remove One Line A Day, demote Letters to opt-in"))
    s.append(pr_row("117", "Fix: journal_perspectives column — author_id &rarr; family_member_id",
                     "Pre-existing 400 query silently failing for months"))
    s.append(pr_row("118", "Fix: journal entry page crash — bind server action instead of inline arrow"))
    s.append(pr_row("119", "Nav reorg: grouped sections, honest categories, pricing copy"))
    s.append(pr_row("120", "Home: collapse 4 widgets into one Serendipity card"))
    s.append(pr_row("121", "Defaults: trim new-family seed from 10 features to 3"))
    s.append(pr_row("122", "Onboarding: lead with capture, soften the tone"))
    s.append(pr_row("123", "Defer the WelcomeModal: theme is opt-in, not a gatekeeper"))
    s.append(pr_row("124", "ActivityFeed empty state: align with onboarding tone"))
    s.append(pr_row("125", "Gift flow: tighten copy, drop oversold claim, add gift-aware signup banner"))

    s.append(Paragraph("Infrastructure &amp; audits (May 5)", h3_style))
    s.append(pr_row("126", "Migrations: document actual workflow + add pre-merge guard"))
    s.append(pr_row("127", "Billing re-audit: no new findings, no regressions"))

    s.append(Paragraph("Gift purchase flow (May 7–13)", h3_style))
    s.append(pr_row("128", "Phase A: design doc + pending_gifts migration"))
    s.append(pr_row("129", "Phase B: buyer form + Stripe gift checkout"))
    s.append(pr_row("130", "Phase C: webhook handler + recipient/buyer emails"))
    s.append(pr_row("131", "Phase D: recipient redemption page + claim API",
                     "End-to-end gift flow live in production"))
    s.append(pr_row("133", "Add gift welcome banner for new recipients"))
    s.append(pr_row("134", "Fix LCP: eager-load first activity feed image"))

    s.append(themed_panel("Inflection point", [
        Paragraph(
            "PR #128–131 — the four-phase gift flow. Until now, gifting "
            "was a workaround: buy Legacy yourself, configure the Nest, "
            "and physically hand over your own login credentials. After "
            "these four PRs, gifting is a first-class purchase flow: "
            "buyer pays as a guest, recipient gets an email, recipient "
            "redeems and owns the Nest from day one. The marketing claim "
            "(&ldquo;the gift the whole family keeps&rdquo;) finally "
            "matches the actual product mechanic.",
            body_style,
        ),
    ]))
    s.append(PageBreak())

    # ── STRATEGIC DECISIONS ──────────────────────────────────────────────
    s.append(Paragraph("DECISIONS THAT SHAPED THE BUILD", kicker_style))
    s.append(Paragraph("Inflection points in chronological order", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Feb 21 &middot; The product gets its name", h3_style))
    s.append(Paragraph(
        "Renamed from &ldquo;Our Family Nest&rdquo; to &ldquo;Family "
        "Nest.&rdquo; The product stops being a Thompson-family thing and "
        "becomes a platform.",
        body_style,
    ))

    s.append(Paragraph("Mar 12 &middot; Free tier model flip", h3_style))
    s.append(Paragraph(
        "Free tier switches from feature-gated to volume-gated. All "
        "features available, just with low usage caps. Without this, the "
        "Feature Catalog (Phase 3) wouldn&apos;t work.",
        body_style,
    ))

    s.append(Paragraph("Mar 18 &middot; Feature Catalog architecture", h3_style))
    s.append(Paragraph(
        "Every non-core feature becomes opt-in per family. Unlocks "
        "shipping niche features without bloating the default nav.",
        body_style,
    ))

    s.append(Paragraph("Mar 20 &middot; Mother&apos;s Day pricing campaign", h3_style))
    s.append(Paragraph(
        "Legacy gets a founding rate at $249 (from $349) with a Mother&apos;s "
        "Day countdown. The plan structure crystallizes: Free / Full "
        "Nest $6.99/mo / Legacy $249–$349 one-time.",
        body_style,
    ))

    s.append(Paragraph("Mar 26 &middot; &ldquo;Family Media. Not Social Media.&rdquo;", h3_style))
    s.append(Paragraph(
        "The positioning line ships across the homepage. Becomes the "
        "north star for every UX decision after — anything that feels "
        "like a streak or engagement mechanic gets cut.",
        body_style,
    ))

    s.append(Paragraph("Mar 29 &middot; Tight family pivot", h3_style))
    s.append(Paragraph(
        "Audience narrowed from multi-generational to tight family. "
        "Triggers a homepage rewrite, the Letters feature, and the drip "
        "email rewrite. Carries into Phase 5 explicitly.",
        body_style,
    ))

    s.append(Paragraph("Apr 23 &middot; Cold site quality review", h3_style))
    s.append(Paragraph(
        "User asks for an honest walkthrough of familynest.io. Triggers "
        "eighteen consecutive simplification PRs. The dashboard goes from "
        "five-dropdown / twenty-nine-item nav to four-dropdown / "
        "grouped / honest categories. Brand alignment (&ldquo;not social "
        "media&rdquo;) finally has implementation backing it up.",
        body_style,
    ))

    s.append(Paragraph("May 7 &middot; Gift flow built right", h3_style))
    s.append(Paragraph(
        "The four-phase gift purchase flow replaces the &ldquo;wrap your "
        "own login on a card&rdquo; workaround with a real "
        "buyer-pays-then-recipient-redeems mechanic. The marketing claim "
        "finally matches the product.",
        body_style,
    ))

    s.append(PageBreak())

    # ── WHERE WE ARE NOW ─────────────────────────────────────────────────
    s.append(Paragraph("RIGHT NOW", kicker_style))
    s.append(Paragraph("Where the build stands today", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.2 * inch))

    s.append(stats_row([
        ("Plan tiers", "3"),
        ("Add-on features", "30+"),
        ("Migrations applied", "150+"),
        ("Test coverage", "Audit-driven"),
    ]))
    s.append(Spacer(1, 0.3 * inch))

    s.append(Paragraph("The product as it sits", h3_style))
    s.append(Paragraph(
        "A private Next.js + Supabase app for tight nuclear families. "
        "Three pricing tiers (Free / Full Nest monthly / Legacy "
        "one-time). A core nav of Home / Family / Memories / Activities "
        "with grouped section headers, plus thirty-plus opt-in features "
        "via Feature Catalog. A real gift purchase flow that issues a "
        "redemption token, emails the recipient, and creates their "
        "account on redemption with the Legacy plan applied from day one.",
        body_style,
    ))

    s.append(Paragraph("What just shipped (May 16)", h3_style))
    s.append(Paragraph(
        "Session handoff doc and this PDF, so the next session has "
        "everything it needs to pick up cold without re-reading the "
        "whole chat. The gift flow is live but has not yet been tested "
        "with a real Stripe payment.",
        body_style,
    ))

    s.append(themed_panel("Top of mind for the next session", [
        Paragraph(
            "&bull; <b>Real-money gift flow test</b> — buyer pays $249, "
            "verifies all three emails arrive, walks the recipient "
            "redemption, refunds via Stripe dashboard. Top priority.",
            body_style,
        ),
        Paragraph(
            "&bull; <b>Phase E polish</b> — printable gift card (with "
            "print-specific CSS). The dashboard gift welcome banner is "
            "already shipped (PR 133).",
            body_style,
        ),
        Paragraph(
            "&bull; <b>Parked backlog</b> — performance pass, /blog and "
            "/contact page audits, KPI/analytics for the UX changes "
            "from Phase 5, G7 (long-standing client-side upload pre-gating "
            "in 5 modules), and a future re-enable of CI migration "
            "auto-application (4–6 hr reconciliation project).",
            body_style,
        ),
    ], bg=BG_ALT))

    s.append(PageBreak())

    # ── CLOSING ──────────────────────────────────────────────────────────
    s.append(Paragraph("WHERE TO PICK UP", kicker_style))
    s.append(Paragraph("Cold-start guide", h1_style))
    s.append(section_rule())
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph(
        "Read <i>docs/SESSION_HANDOFF.md</i> first. It&apos;s the canonical "
        "single page that captures the gotchas, locked decisions, and "
        "files-to-know-about. This PDF is for the human; the markdown is "
        "for the model.",
        body_style,
    ))

    s.append(Paragraph(
        "When the next session starts, the expected opening line is:",
        body_style,
    ))
    s.append(themed_panel("Suggested opening", [
        Paragraph(
            "<i>&ldquo;Did the real-money gift flow test happen? If yes — "
            "what worked, what didn&apos;t? If no — let me know if you "
            "want to walk through it, or pick from the parked backlog.&rdquo;</i>",
            body_style,
        ),
    ]))

    s.append(Spacer(1, 0.3 * inch))

    s.append(themed_panel("Files to know about", [
        Paragraph("<b>docs/SESSION_HANDOFF.md</b> — cold-start handoff doc.", body_style),
        Paragraph("<b>docs/GIFT_FLOW_DESIGN.md</b> — gift flow architecture.", body_style),
        Paragraph("<b>docs/BILLING_FINDINGS.md</b> — canonical billing audit log.", body_style),
        Paragraph("<b>docs/BILLING_AUDIT_2026-05-05.md</b> — most recent audit snapshot.", body_style),
        Paragraph("<b>scripts/check-pending-migrations.sh</b> — pre-merge SQL guard.", body_style),
        Paragraph("<b>scripts/build_timeline_pdf.py</b> — this PDF generator (rerun to refresh).", body_style),
        Paragraph("<b>memory/project_target_audience.md</b> — audience pivot note.", body_style),
        Paragraph("<b>CLAUDE.md</b> — the Database Migrations section has the canonical workflow.", body_style),
    ]))

    s.append(Spacer(1, 0.5 * inch))
    s.append(Paragraph(
        "&mdash; End of timeline &mdash;",
        small_style,
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
        title="FamilyNest — The Build (Feb 5 – May 16, 2026)",
        author="Family Nest",
        subject="Full build timeline",
    )
    doc.build(build_story())
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
