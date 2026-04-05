import { describe, it, expect } from "vitest";
import { esc, emailWrapper, card, ctaButton } from "@/app/api/emails/templates/shared";
import { birthdayEmailHtml } from "@/app/api/emails/templates/birthday";
import { capsuleEmailHtml } from "@/app/api/emails/templates/capsule";
import { digestEmailHtml } from "@/app/api/emails/templates/digest";
import {
  day1ActivationEmailHtml,
  day3DiscoveryEmailHtml,
  day5InviteEmailHtml,
  day14UpgradeEmailHtml,
  day30ReengagementEmailHtml,
} from "@/app/api/emails/templates/drip";

describe("email template shared utils", () => {
  describe("esc()", () => {
    it("escapes < and >", () => {
      expect(esc("<script>")).toBe("&lt;script&gt;");
    });
    it("escapes &", () => {
      expect(esc("foo & bar")).toBe("foo &amp; bar");
    });
    it("escapes double and single quotes", () => {
      expect(esc('"quoted"')).toBe("&quot;quoted&quot;");
      expect(esc("it's")).toBe("it&#39;s");
    });
    it("returns plain strings unchanged", () => {
      expect(esc("Hello World")).toBe("Hello World");
    });
    it("escapes a full XSS payload", () => {
      const payload = '<img src=x onerror="alert(1)">';
      const escaped = esc(payload);
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
    });
  });

  describe("emailWrapper()", () => {
    it("produces valid HTML structure", () => {
      const html = emailWrapper("<tr><td>body</td></tr>");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<body");
      expect(html).toContain("body");
    });
    it("includes the footer with unsubscribe link", () => {
      const html = emailWrapper("");
      expect(html).toContain("Unsubscribe");
      expect(html).toContain("dashboard/settings");
    });
  });

  describe("ctaButton()", () => {
    it("renders an anchor with the correct label and href", () => {
      const btn = ctaButton("Click me", "https://example.com");
      expect(btn).toContain("Click me");
      expect(btn).toContain("https://example.com");
      expect(btn).toContain("<a ");
    });
  });
});

describe("birthday email template", () => {
  it("includes the member name and age text", () => {
    const html = birthdayEmailHtml("Alice", " (turning 30)", "Bob");
    expect(html).toContain("Alice");
    expect(html).toContain("turning 30");
    expect(html).toContain("Bob");
  });

  it("escapes HTML in member names", () => {
    const html = birthdayEmailHtml("<evil>", "", "recipient");
    expect(html).not.toContain("<evil>");
    expect(html).toContain("&lt;evil&gt;");
  });

  it("renders without age text when omitted", () => {
    const html = birthdayEmailHtml("Alice", "", "Bob");
    expect(html).toContain("Alice");
    expect(html).not.toContain("turning");
  });
});

describe("capsule email template", () => {
  it("includes recipient name, sender name, and title", () => {
    const html = capsuleEmailHtml("Alice", "Bob", "My Letter");
    expect(html).toContain("Alice");
    expect(html).toContain("Bob");
    expect(html).toContain("My Letter");
  });

  it("escapes HTML in all three parameters", () => {
    const html = capsuleEmailHtml("<r>", "<s>", "<t>");
    expect(html).not.toContain("<r>");
    expect(html).not.toContain("<s>");
    expect(html).not.toContain("<t>");
  });
});

describe("digest email template", () => {
  it("includes family name and section labels", () => {
    const html = digestEmailHtml({
      familyName: "Smith",
      recipientName: "Alice",
      weekStart: "March 17",
      weekEnd: "March 23",
      sections: [
        { label: "Journal", icon: "📓", items: [{ title: "Camping trip", authorName: "Dad", thumbnailUrl: null, href: "/dashboard/journal/1", dateLabel: "Monday" }] },
        { label: "Voice Memos", icon: "🎙️", items: [{ title: "Grandma's story", authorName: "Grandma", thumbnailUrl: null, href: "/dashboard/voice-memos", dateLabel: "Tuesday" }] },
      ],
      upcomingBirthdays: [],
      onThisDayItem: null,
    });
    expect(html).toContain("Smith");
    expect(html).toContain("Alice");
    expect(html).toContain("Camping trip");
    expect(html).toContain("Grandma&#39;s story");
    expect(html).toContain("Journal");
    expect(html).toContain("Voice Memos");
  });

  it("shows empty state prompt when no sections have content", () => {
    const html = digestEmailHtml({
      familyName: "Family",
      recipientName: "Alice",
      weekStart: "March 17",
      weekEnd: "March 23",
      sections: [],
      upcomingBirthdays: [],
      onThisDayItem: null,
    });
    expect(html).toContain("hasn't added anything this week yet");
  });

  it("shows upcoming birthdays", () => {
    const html = digestEmailHtml({
      familyName: "Family",
      recipientName: "Alice",
      weekStart: "March 17",
      weekEnd: "March 23",
      sections: [],
      upcomingBirthdays: [{ name: "Emma", daysUntil: 2, turningAge: 8 }],
      onThisDayItem: null,
    });
    expect(html).toContain("Emma");
    expect(html).toContain("turning 8");
  });

  it("shows on this day item", () => {
    const html = digestEmailHtml({
      familyName: "Family",
      recipientName: "Alice",
      weekStart: "March 17",
      weekEnd: "March 23",
      sections: [],
      upcomingBirthdays: [],
      onThisDayItem: { title: "Summer vacation 2019", yearsAgo: 7, href: "/dashboard/journal/42" },
    });
    expect(html).toContain("Summer vacation 2019");
    expect(html).toContain("7 years ago");
  });
});

describe("drip campaign templates", () => {
  it("day1 email contains name and photo CTA", () => {
    const html = day1ActivationEmailHtml("Alice");
    expect(html).toContain("Alice");
    expect(html).toContain("dashboard/photos");
  });

  it("day3 email contains name and feature list", () => {
    const html = day3DiscoveryEmailHtml("Bob");
    expect(html).toContain("Bob");
    expect(html).toContain("Voice Memos");
    expect(html).toContain("Time Capsules");
  });

  it("day5 email contains name and invite CTA", () => {
    const html = day5InviteEmailHtml("Carol");
    expect(html).toContain("Carol");
    expect(html).toContain("dashboard/members");
  });

  it("day14 email contains name and pricing CTA", () => {
    const html = day14UpgradeEmailHtml("Dave");
    expect(html).toContain("Dave");
    expect(html).toContain("pricing");
  });

  it("day30 email contains name and family name", () => {
    const html = day30ReengagementEmailHtml("Eve", "Thompson");
    expect(html).toContain("Eve");
    expect(html).toContain("Thompson");
    expect(html).toContain("dashboard");
  });

  it("drip templates escape HTML in names", () => {
    const html = day30ReengagementEmailHtml("<script>", "<family>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<family>");
  });
});
