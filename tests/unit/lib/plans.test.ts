import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canUploadVideos,
  canEditMap,
  canSharePublicly,
  canManageNestKeepers,
  journalEntryLimit,
  getFamilyPlan,
  enforceStorageLimit,
  addStorageUsage,
  subtractStorageUsage,
} from "@/src/lib/plans";
import { createMockSupabaseClient } from "@/tests/mocks/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("plans.ts", () => {
  describe("Pure plan limit functions", () => {
    describe("canUploadVideos", () => {
      it("should return false for free plan", () => {
        expect(canUploadVideos("free")).toBe(false);
      });

      it("should return true for annual plan", () => {
        expect(canUploadVideos("annual")).toBe(true);
      });

      it("should return true for legacy plan", () => {
        expect(canUploadVideos("legacy")).toBe(true);
      });
    });

    describe("canEditMap", () => {
      it("should return false for free plan", () => {
        expect(canEditMap("free")).toBe(false);
      });

      it("should return true for annual plan", () => {
        expect(canEditMap("annual")).toBe(true);
      });

      it("should return true for legacy plan", () => {
        expect(canEditMap("legacy")).toBe(true);
      });
    });

    describe("canSharePublicly", () => {
      it("should return false for free plan", () => {
        expect(canSharePublicly("free")).toBe(false);
      });

      it("should return true for annual plan", () => {
        expect(canSharePublicly("annual")).toBe(true);
      });

      it("should return true for legacy plan", () => {
        expect(canSharePublicly("legacy")).toBe(true);
      });
    });

    describe("canManageNestKeepers", () => {
      it("should return false for free plan", () => {
        expect(canManageNestKeepers("free")).toBe(false);
      });

      it("should return false for annual plan", () => {
        expect(canManageNestKeepers("annual")).toBe(false);
      });

      it("should return true for legacy plan", () => {
        expect(canManageNestKeepers("legacy")).toBe(true);
      });
    });

    describe("journalEntryLimit", () => {
      it("should return 10 for free plan", () => {
        expect(journalEntryLimit("free")).toBe(10);
      });

      it("should return null (unlimited) for annual plan", () => {
        expect(journalEntryLimit("annual")).toBe(null);
      });

      it("should return null (unlimited) for legacy plan", () => {
        expect(journalEntryLimit("legacy")).toBe(null);
      });
    });
  });

  describe("Database-dependent functions", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      vi.clearAllMocks();
      mockSupabase = createMockSupabaseClient();
    });

    describe("getFamilyPlan", () => {
      it("should fetch plan data from database", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  plan_type: "annual",
                  storage_used_bytes: 5000000,
                  storage_limit_bytes: 2097152000,
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        const result = await getFamilyPlan(mockSupabase, "family-1");

        expect(mockFrom).toHaveBeenCalledWith("families");
        expect(result).toEqual({
          planType: "annual",
          storageUsedBytes: 5000000,
          storageLimitBytes: 2097152000,
        });
      });

      it("should return defaults when no data found", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        const result = await getFamilyPlan(mockSupabase, "family-1");

        expect(result.planType).toBe("free");
        expect(result.storageUsedBytes).toBe(0);
        expect(result.storageLimitBytes).toBe(524288000); // 500 MB default
      });

      it("should handle partial data (only plan_type)", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  plan_type: "legacy",
                  storage_used_bytes: null,
                  storage_limit_bytes: null,
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        const result = await getFamilyPlan(mockSupabase, "family-1");

        expect(result.planType).toBe("legacy");
        expect(result.storageUsedBytes).toBe(0);
        expect(result.storageLimitBytes).toBe(524288000);
      });
    });

    describe("enforceStorageLimit", () => {
      it("should throw error when storage limit would be exceeded", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  plan_type: "free",
                  storage_used_bytes: 520000000, // 496 MB used
                  storage_limit_bytes: 524288000, // 500 MB limit
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        await expect(
          enforceStorageLimit(mockSupabase, "family-1", 10000000) // Try to add 10 MB
        ).rejects.toThrow(/Storage limit reached/);
      });

      it("should not throw when within limit", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  plan_type: "annual",
                  storage_used_bytes: 1000000, // 1 MB used
                  storage_limit_bytes: 2097152000, // 2 GB limit
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        await expect(
          enforceStorageLimit(mockSupabase, "family-1", 5000000) // Add 5 MB
        ).resolves.not.toThrow();
      });

      it("should throw with exact MB values in error message", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  plan_type: "free",
                  storage_used_bytes: 520093696, // ~496 MB
                  storage_limit_bytes: 524288000, // 500 MB
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        await expect(
          enforceStorageLimit(mockSupabase, "family-1", 10000000)
        ).rejects.toThrow(/496 MB \/ 500 MB/);
      });

      it("should allow upload exactly at limit", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  plan_type: "free",
                  storage_used_bytes: 500000000,
                  storage_limit_bytes: 524288000,
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        // Adding exactly to the limit should succeed
        await expect(
          enforceStorageLimit(mockSupabase, "family-1", 24288000)
        ).resolves.not.toThrow();
      });

      it("should reject upload one byte over limit", async () => {
        const mockFrom = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  plan_type: "free",
                  storage_used_bytes: 500000000,
                  storage_limit_bytes: 524288000,
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from = mockFrom;

        // One byte over limit should fail
        await expect(
          enforceStorageLimit(mockSupabase, "family-1", 24288001)
        ).rejects.toThrow(/Storage limit reached/);
      });
    });

    describe("addStorageUsage", () => {
      it("should call increment_storage_used RPC with correct params", async () => {
        const rpcSpy = vi.spyOn(mockSupabase, "rpc");

        await addStorageUsage(mockSupabase, "family-1", 5000000);

        expect(rpcSpy).toHaveBeenCalledWith("increment_storage_used", {
          fid: "family-1",
          bytes_to_add: 5000000,
        });
      });

      it("should handle zero bytes", async () => {
        const rpcSpy = vi.spyOn(mockSupabase, "rpc");

        await addStorageUsage(mockSupabase, "family-1", 0);

        expect(rpcSpy).toHaveBeenCalledWith("increment_storage_used", {
          fid: "family-1",
          bytes_to_add: 0,
        });
      });
    });

    describe("subtractStorageUsage", () => {
      it("should call decrement_storage_used RPC with correct params", async () => {
        const rpcSpy = vi.spyOn(mockSupabase, "rpc");

        await subtractStorageUsage(mockSupabase, "family-1", 3000000);

        expect(rpcSpy).toHaveBeenCalledWith("decrement_storage_used", {
          fid: "family-1",
          bytes_to_subtract: 3000000,
        });
      });

      it("should handle large file deletions", async () => {
        const rpcSpy = vi.spyOn(mockSupabase, "rpc");

        await subtractStorageUsage(mockSupabase, "family-1", 100000000); // 100 MB

        expect(rpcSpy).toHaveBeenCalledWith("decrement_storage_used", {
          fid: "family-1",
          bytes_to_subtract: 100000000,
        });
      });
    });
  });
});
