import { describe, it, expect } from "vitest";
import {
  detectRoleFromBirthDate,
  calculateAge,
  canManageMembers,
  canDeleteContent,
  canCreateContent,
  canEditSettings,
  canInviteMembers,
  canManageBilling,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from "@/src/lib/roles";

describe("roles.ts", () => {
  describe("detectRoleFromBirthDate", () => {
    it("should return 'child' for age < 13", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10);
      const result = detectRoleFromBirthDate(birthDate.toISOString().split("T")[0]);
      expect(result).toBe("child");
    });

    it("should return 'teen' for age 13-17", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15);
      const result = detectRoleFromBirthDate(birthDate.toISOString().split("T")[0]);
      expect(result).toBe("teen");
    });

    it("should return 'adult' for age >= 18", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      const result = detectRoleFromBirthDate(birthDate.toISOString().split("T")[0]);
      expect(result).toBe("adult");
    });

    it("should return null for invalid birth date", () => {
      expect(detectRoleFromBirthDate(null)).toBe(null);
      expect(detectRoleFromBirthDate(undefined)).toBe(null);
      expect(detectRoleFromBirthDate("invalid-date")).toBe(null);
      expect(detectRoleFromBirthDate("")).toBe(null);
    });

    it("should handle exact 13th birthday (becomes teen)", () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 13,
        today.getMonth(),
        today.getDate()
      );
      const result = detectRoleFromBirthDate(birthDate.toISOString().split("T")[0]);
      expect(result).toBe("teen");
    });

    it("should handle exact 18th birthday (becomes adult)", () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      const result = detectRoleFromBirthDate(birthDate.toISOString().split("T")[0]);
      expect(result).toBe("adult");
    });

    it("should handle birthday not yet reached this year", () => {
      const today = new Date();
      // Birth date is 10 years ago but birthday is tomorrow
      const birthDate = new Date(
        today.getFullYear() - 10,
        today.getMonth(),
        today.getDate() + 1
      );
      const result = detectRoleFromBirthDate(birthDate.toISOString().split("T")[0]);
      // Should still be considered 11 years old (child)
      expect(result).toBe("child");
    });

    it("should handle leap year edge case", () => {
      // Someone born on Feb 29, 2008 (leap year) is 16 on Feb 28, 2024
      const birthDate = "2008-02-29";
      const result = detectRoleFromBirthDate(birthDate);
      // Age will vary based on current date, but function should not crash
      expect(result).toBeTypeOf("string");
    });
  });

  describe("calculateAge", () => {
    it("should calculate correct age for adult", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      const age = calculateAge(birthDate.toISOString().split("T")[0]);
      expect(age).toBe(30);
    });

    it("should calculate correct age for child", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 8);
      const age = calculateAge(birthDate.toISOString().split("T")[0]);
      expect(age).toBe(8);
    });

    it("should return null for invalid birth date", () => {
      expect(calculateAge(null)).toBe(null);
      expect(calculateAge(undefined)).toBe(null);
      expect(calculateAge("invalid")).toBe(null);
    });

    it("should handle age 0 for babies", () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear(),
        today.getMonth() - 6,
        today.getDate()
      );
      const age = calculateAge(birthDate.toISOString().split("T")[0]);
      expect(age).toBe(0);
    });

    it("should handle birthday not yet occurred this year", () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 20,
        today.getMonth(),
        today.getDate() + 1
      );
      const age = calculateAge(birthDate.toISOString().split("T")[0]);
      // Should still be 19 (birthday is tomorrow)
      expect(age).toBe(19);
    });
  });

  describe("canManageMembers", () => {
    it("should return true only for owner", () => {
      expect(canManageMembers("owner")).toBe(true);
      expect(canManageMembers("adult")).toBe(false);
      expect(canManageMembers("teen")).toBe(false);
      expect(canManageMembers("child")).toBe(false);
    });
  });

  describe("canDeleteContent", () => {
    it("should allow owner to delete any content", () => {
      expect(canDeleteContent("owner", false)).toBe(true);
      expect(canDeleteContent("owner", true)).toBe(true);
    });

    it("should allow adult to delete only own content", () => {
      expect(canDeleteContent("adult", true)).toBe(true);
      expect(canDeleteContent("adult", false)).toBe(false);
    });

    it("should allow teen to delete only own content", () => {
      expect(canDeleteContent("teen", true)).toBe(true);
      expect(canDeleteContent("teen", false)).toBe(false);
    });

    it("should not allow child to delete any content", () => {
      expect(canDeleteContent("child", true)).toBe(false);
      expect(canDeleteContent("child", false)).toBe(false);
    });
  });

  describe("canCreateContent", () => {
    it("should allow owner, adult, and teen to create content", () => {
      expect(canCreateContent("owner")).toBe(true);
      expect(canCreateContent("adult")).toBe(true);
      expect(canCreateContent("teen")).toBe(true);
    });

    it("should not allow child to create content (no login)", () => {
      expect(canCreateContent("child")).toBe(false);
    });
  });

  describe("canEditSettings", () => {
    it("should return true only for owner", () => {
      expect(canEditSettings("owner")).toBe(true);
      expect(canEditSettings("adult")).toBe(false);
      expect(canEditSettings("teen")).toBe(false);
      expect(canEditSettings("child")).toBe(false);
    });
  });

  describe("canInviteMembers", () => {
    it("should allow owner and adult to invite members", () => {
      expect(canInviteMembers("owner")).toBe(true);
      expect(canInviteMembers("adult")).toBe(true);
    });

    it("should not allow teen or child to invite members", () => {
      expect(canInviteMembers("teen")).toBe(false);
      expect(canInviteMembers("child")).toBe(false);
    });
  });

  describe("canManageBilling", () => {
    it("should return true only for owner", () => {
      expect(canManageBilling("owner")).toBe(true);
      expect(canManageBilling("adult")).toBe(false);
      expect(canManageBilling("teen")).toBe(false);
      expect(canManageBilling("child")).toBe(false);
    });
  });

  describe("ROLE_LABELS", () => {
    it("should have labels for all roles", () => {
      expect(ROLE_LABELS.owner).toBe("Account Owner");
      expect(ROLE_LABELS.adult).toBe("Adult");
      expect(ROLE_LABELS.teen).toBe("Teen");
      expect(ROLE_LABELS.child).toBe("Child");
    });
  });

  describe("ROLE_DESCRIPTIONS", () => {
    it("should have descriptions for all roles", () => {
      expect(ROLE_DESCRIPTIONS.owner).toContain("billing");
      expect(ROLE_DESCRIPTIONS.adult).toContain("manage");
      expect(ROLE_DESCRIPTIONS.teen).toContain("limited");
      expect(ROLE_DESCRIPTIONS.child).toContain("No login");
    });
  });
});
