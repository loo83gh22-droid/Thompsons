import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a mock Supabase client for testing
 * Provides chainable query methods and mock implementations for auth, storage, and RPC
 */
export function createMockSupabaseClient(overrides = {}): SupabaseClient {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "test-user-id" } } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: vi.fn((bucket: string) => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://test.supabase.co/signed-url" },
          error: null,
        }),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${bucket}/${path}` },
        })),
      })),
    },
    ...overrides,
  };

  return mockClient as unknown as SupabaseClient;
}

/**
 * Mock the server-side Supabase client module
 * Use this in tests that import from @/src/lib/supabase/server
 */
export function mockSupabaseServerClient(client?: SupabaseClient) {
  vi.mock("@/src/lib/supabase/server", () => ({
    createClient: vi.fn(() => client || createMockSupabaseClient()),
  }));
}

/**
 * Mock the browser-side Supabase client module
 * Use this in tests that import from @/src/lib/supabase/client
 */
export function mockSupabaseBrowserClient(client?: SupabaseClient) {
  vi.mock("@/src/lib/supabase/client", () => ({
    createClient: vi.fn(() => client || createMockSupabaseClient()),
  }));
}
