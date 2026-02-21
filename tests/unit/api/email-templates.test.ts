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
  it("includes family name and activity summary", () => {
    const html = digestEmailHtml("Alice", "Smith", {
      journals: 2,
      photos: 5,
      voices: 1,
      stories: 0,
    });
    expect(html).toContain("Smith");
    expect(html).toContain("2 journal entries");
    expect(html).toContain("5 photos");
    expect(html).toContain("1 voice memo");
    expect(html).not.toContain("stories");
  });

  it("uses singular forms correctly", () => {
    const html = digestEmailHtml("Alice", "Family", {
      journals: 1,
      photos: 1,
      voices: 1,
      stories: 1,
    });
    expect(html).toContain("1 journal entry");
    expect(html).toContain("1 photo");
    expect(html).toContain("1 voice memo");
    expect(html).toContain("1 story");
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
