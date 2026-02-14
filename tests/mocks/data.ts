import type { MemberRole } from "@/src/lib/roles";
import type { PlanType } from "@/src/lib/constants";

/**
 * Test fixture factory functions
 * These create realistic test data with sensible defaults and allow overrides
 */

export const mockFamilyMember = (overrides = {}) => ({
  id: "member-1",
  family_id: "family-1",
  user_id: "user-1",
  name: "John Doe",
  role: "adult" as MemberRole,
  birth_date: "1990-01-01",
  birth_place: "New York, NY",
  relationship: "Father",
  contact_email: "john@example.com",
  nickname: null,
  avatar_url: null,
  kid_access_token: null,
  kid_token_expires_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const mockFamily = (overrides = {}) => ({
  id: "family-1",
  name: "The Doe Family",
  plan_type: "annual" as PlanType,
  storage_used_bytes: 1000000, // 1 MB
  storage_limit_bytes: 2097152000, // 2 GB (annual plan default)
  plan_started_at: "2024-01-01T00:00:00Z",
  plan_expires_at: "2025-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const mockJournalEntry = (overrides = {}) => ({
  id: "entry-1",
  family_id: "family-1",
  author_id: "member-1",
  created_by: "user-1",
  title: "Summer Vacation",
  content: "We had a great time at the beach!",
  location: "Beach Resort",
  latitude: 40.7128,
  longitude: -74.006,
  trip_date: "2024-07-15",
  trip_date_end: null,
  created_at: "2024-07-16T00:00:00Z",
  updated_at: "2024-07-16T00:00:00Z",
  ...overrides,
});

export const mockJournalPhoto = (overrides = {}) => ({
  id: "photo-1",
  journal_entry_id: "entry-1",
  family_id: "family-1",
  photo_url: "https://test.supabase.co/storage/v1/object/public/journal-photos/test.jpg",
  caption: null,
  sort_order: 1,
  file_size_bytes: 500000,
  created_at: "2024-07-16T00:00:00Z",
  ...overrides,
});

export const mockJournalVideo = (overrides = {}) => ({
  id: "video-1",
  journal_entry_id: "entry-1",
  family_id: "family-1",
  video_url: "https://test.supabase.co/storage/v1/object/public/journal-videos/test.mp4",
  thumbnail_url: null,
  caption: null,
  sort_order: 1,
  file_size_bytes: 10000000, // 10 MB
  duration_seconds: 45,
  created_at: "2024-07-16T00:00:00Z",
  ...overrides,
});

export const mockTravelLocation = (overrides = {}) => ({
  id: "location-1",
  family_id: "family-1",
  family_member_id: "member-1",
  location_name: "New York, NY",
  latitude: 40.7128,
  longitude: -74.006,
  country: "US",
  visit_count: 1,
  location_cluster_id: "cluster-1",
  is_birth_place: false,
  location_type: "vacation",
  created_at: "2024-07-16T00:00:00Z",
  ...overrides,
});

export const mockFamilyStory = (overrides = {}) => ({
  id: "story-1",
  family_id: "family-1",
  title: "How We Met",
  content: "It was a sunny day...",
  author_id: "member-1",
  event_date: "1985-06-15",
  location: "Central Park",
  latitude: 40.785091,
  longitude: -73.968285,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const mockRecipe = (overrides = {}) => ({
  id: "recipe-1",
  family_id: "family-1",
  title: "Grandma's Apple Pie",
  description: "A family favorite for generations",
  ingredients: "Apples, flour, sugar, butter",
  instructions: "1. Preheat oven\n2. Mix ingredients\n3. Bake for 45 minutes",
  servings: 8,
  prep_time_minutes: 30,
  cook_time_minutes: 45,
  author_id: "member-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const mockVoiceMemo = (overrides = {}) => ({
  id: "memo-1",
  family_id: "family-1",
  family_member_id: "member-1",
  title: "Birthday Message",
  audio_url: "https://test.supabase.co/storage/v1/object/public/voice-memos/test.mp3",
  duration_seconds: 120,
  file_size_bytes: 2000000,
  transcript: null,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const mockFamilyExport = (overrides = {}) => ({
  id: "export-1",
  family_id: "family-1",
  requested_by: "user-1",
  status: "completed" as "pending" | "processing" | "completed" | "failed",
  file_path: "family-1/export.zip",
  file_size_bytes: 50000000, // 50 MB
  error_message: null,
  created_at: "2024-01-01T00:00:00Z",
  completed_at: "2024-01-01T01:00:00Z",
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  ...overrides,
});

export const mockHomeMosaicPhoto = (overrides = {}) => ({
  id: "mosaic-photo-1",
  family_id: "family-1",
  photo_url: "https://test.supabase.co/storage/v1/object/public/home-mosaic/test.jpg",
  uploaded_by: "member-1",
  file_size_bytes: 500000,
  sort_order: 1,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

/**
 * Create multiple family members with different roles
 */
export const mockFamilyMembers = {
  owner: mockFamilyMember({ id: "owner-1", role: "owner", name: "Sarah Owner" }),
  adult: mockFamilyMember({ id: "adult-1", role: "adult", name: "John Adult" }),
  teen: mockFamilyMember({
    id: "teen-1",
    role: "teen",
    name: "Emily Teen",
    birth_date: new Date(
      new Date().getFullYear() - 15,
      0,
      1
    ).toISOString().split("T")[0],
  }),
  child: mockFamilyMember({
    id: "child-1",
    role: "child",
    name: "Timmy Child",
    birth_date: new Date(
      new Date().getFullYear() - 8,
      0,
      1
    ).toISOString().split("T")[0],
  }),
};

/**
 * Create families with different plan types
 */
export const mockFamilies = {
  free: mockFamily({
    id: "family-free",
    name: "Free Plan Family",
    plan_type: "free" as PlanType,
    storage_limit_bytes: 524288000, // 500 MB
  }),
  annual: mockFamily({
    id: "family-annual",
    name: "Annual Plan Family",
    plan_type: "annual" as PlanType,
    storage_limit_bytes: 2097152000, // 2 GB
  }),
  legacy: mockFamily({
    id: "family-legacy",
    name: "Legacy Plan Family",
    plan_type: "legacy" as PlanType,
    storage_limit_bytes: 5242880000, // 5 GB
  }),
};
