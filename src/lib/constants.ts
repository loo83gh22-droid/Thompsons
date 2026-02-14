/**
 * Centralized application constants
 *
 * This file contains all magic numbers and configuration values used throughout
 * the application. Constants are organized by domain for easy navigation.
 */

/* ══════════════════════════════════════════════════════════════
   PLAN LIMITS
   ══════════════════════════════════════════════════════════════ */

/**
 * Feature limits for each subscription plan type
 */
export const PLAN_LIMITS = {
  free: {
    /** Maximum journal entries allowed (null = unlimited) */
    journalEntries: 10,
    /** Storage limit in bytes (500 MB) */
    storageLimitBytes: 524288000,
    /** Whether video uploads are permitted */
    videoUploads: false,
    /** Whether map editing (adding locations) is permitted */
    mapEditing: false,
    /** Whether public sharing links are permitted */
    publicSharing: false,
  },
  annual: {
    journalEntries: null, // unlimited
    storageLimitBytes: 2097152000, // 2000 MB = 2 GB
    videoUploads: true,
    mapEditing: true,
    publicSharing: true,
  },
  legacy: {
    journalEntries: null, // unlimited
    storageLimitBytes: 5242880000, // 5000 MB = 5 GB
    videoUploads: true,
    mapEditing: true,
    publicSharing: true,
    /** Only legacy plans can manage nest keepers */
    nestKeeperManagement: true,
  },
} as const;

/**
 * Default storage limit when plan data is unavailable (500 MB)
 */
export const DEFAULT_STORAGE_LIMIT_BYTES = 524288000;

/* ══════════════════════════════════════════════════════════════
   MEDIA LIMITS
   ══════════════════════════════════════════════════════════════ */

/**
 * Video upload constraints
 */
export const VIDEO_LIMITS = {
  /** Maximum video file size in bytes (300 MB) */
  maxSizeBytes: 314572800,
  /** Maximum video file size in MB (for display) */
  maxSizeMB: 300,
  /** Maximum video duration in seconds (5 minutes) */
  maxDurationSeconds: 300,
  /** Maximum number of videos per journal entry */
  maxVideosPerJournalEntry: 2,
} as const;

/**
 * Photo upload constraints
 */
export const PHOTO_LIMITS = {
  /** Default maximum photos per upload/entry */
  maxPhotosPerEntry: 20,
  /** Maximum photos to display in home mosaic background */
  mosaicDisplayLimit: 80,
} as const;

/**
 * Voice memo recording constraints
 */
export const VOICE_MEMO_LIMITS = {
  /** Maximum recording duration in seconds (10 minutes) */
  maxRecordSeconds: 600,
  /** When to show warning during recording in seconds (9 minutes) */
  warningAtSeconds: 540,
} as const;

/* ══════════════════════════════════════════════════════════════
   SEARCH & QUERY LIMITS
   ══════════════════════════════════════════════════════════════ */

/**
 * Search functionality constants
 */
export const SEARCH_LIMITS = {
  /** Results per content type in parallel search */
  resultsPerType: 5,
  /** Maximum total results to return */
  maxTotalResults: 20,
  /** Maximum snippet length in characters */
  snippetMaxLength: 80,
  /** Characters to show before match in snippet */
  snippetContextBefore: 30,
  /** Characters to show after match in snippet */
  snippetContextAfter: 50,
} as const;

/* ══════════════════════════════════════════════════════════════
   DATABASE QUERY LIMITS
   ══════════════════════════════════════════════════════════════ */

/**
 * Default limits for database queries across the application
 */
export const QUERY_LIMITS = {
  /** Timeline items per content type */
  timelineItemsPerType: 100,
  /** Location clusters to fetch for matching */
  locationClusters: 100,
  /** Default dashboard content preview */
  dashboardPreview: 10,
  /** Member list display */
  memberListDisplay: 12,
  /** Recent activity items */
  recentActivity: 10,
  /** Photos in timeline/gallery views */
  photosDisplay: 10,
} as const;

/* ══════════════════════════════════════════════════════════════
   UI DISPLAY CONSTANTS
   ══════════════════════════════════════════════════════════════ */

/**
 * User interface display limits and pagination
 */
export const UI_DISPLAY = {
  /** Items per page in timeline pagination */
  timelinePageSize: 30,

  /** Event window for "upcoming events" in milliseconds (30 days) */
  upcomingEventWindowMs: 30 * 24 * 60 * 60 * 1000,

  /** Notification lookahead window in milliseconds (3 days) */
  notificationLookaheadMs: 3 * 24 * 60 * 60 * 1000,

  /** Default map zoom level */
  mapDefaultZoom: 4,

  /** Default map center coordinates */
  mapDefaultCenter: {
    lat: 56,
    lng: -100,
  },
} as const;

/* ══════════════════════════════════════════════════════════════
   TEXT TRUNCATION LIMITS
   ══════════════════════════════════════════════════════════════ */

/**
 * Maximum character lengths for text fields in display and export
 */
export const TEXT_LIMITS = {
  /** Family name display truncation */
  familyName: 50,
  /** Entry/story/recipe title truncation */
  entryTitle: 60,
  /** Event title truncation */
  eventTitle: 100,
  /** Event description truncation */
  eventDescription: 500,
  /** Meta description for SEO/sharing */
  metaDescription: 160,
} as const;

/* ══════════════════════════════════════════════════════════════
   LOCATION & CLUSTERING
   ══════════════════════════════════════════════════════════════ */

/**
 * Location clustering and map display constants
 */
export const LOCATION_CONSTANTS = {
  /** Distance in kilometers to consider locations as same town */
  clusterDistanceKm: 8,
  /** Distance in kilometers for name-based location matching */
  clusterDistanceNamedKm: 35,
  /** Minimum word length for location name matching */
  nameMatchMinLength: 3,
  /** Location proximity tolerance in degrees for legacy grouping */
  proximityToleranceDegrees: 0.02,
} as const;

/* ══════════════════════════════════════════════════════════════
   TIME & DATE CONSTANTS
   ══════════════════════════════════════════════════════════════ */

/**
 * Time-related constants for calculations and expirations
 */
export const TIME_CONSTANTS = {
  /** Export link expiration in milliseconds (24 hours) */
  exportLinkExpirationMs: 24 * 60 * 60 * 1000,
  /** Milliseconds in one day */
  oneDayMs: 24 * 60 * 60 * 1000,
  /** Seconds in one minute */
  secondsPerMinute: 60,
} as const;

/* ══════════════════════════════════════════════════════════════
   GRID LAYOUTS (Tailwind Classes)
   ══════════════════════════════════════════════════════════════ */

/**
 * Standard grid column patterns used throughout the app.
 * These are Tailwind classes and cannot be extracted as JS constants.
 *
 * Common patterns:
 * - Photo grids: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
 * - Member grids: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
 * - Content cards: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
 */

/* ══════════════════════════════════════════════════════════════
   TYPE EXPORTS
   ══════════════════════════════════════════════════════════════ */

export type PlanType = keyof typeof PLAN_LIMITS;
