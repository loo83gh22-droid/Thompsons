/**
 * Feature Catalog -- single source of truth for all toggleable features.
 *
 * Core features (Journal, Photos, Timeline, Family) are always visible.
 * Everything else lives here and only appears in the nav when a family
 * enables it via the Feature Catalog page (/dashboard/tools).
 */

export type FeatureCategory =
  | "memories"
  | "family-life"
  | "games"
  | "goals"
  | "planning"
  | "travel"
  | "essentials";

export interface CatalogFeature {
  slug: string;
  name: string;
  description: string;
  category: FeatureCategory;
  icon: string;
  href: string;
  available: boolean;
  /** If true, this feature appears in the Memories nav group instead of Extras */
  navGroup?: "memories" | "family" | "extras";
}

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  memories: "Memories & Stories",
  "family-life": "Family Life",
  games: "Games & Challenges",
  goals: "Goals & Lists",
  planning: "Planning & Events",
  travel: "Travel & Adventure",
  essentials: "Family Essentials",
};

export const CATEGORY_ORDER: FeatureCategory[] = [
  "memories",
  "family-life",
  "games",
  "goals",
  "planning",
  "travel",
  "essentials",
];

export const FEATURE_CATALOG: CatalogFeature[] = [
  // Memories & Stories (previously hardcoded in Memories dropdown)
  {
    slug: "stories",
    name: "Stories",
    description:
      "Write and preserve family stories, passed down through generations.",
    category: "memories",
    icon: "\u{1F4D6}",
    href: "/dashboard/stories",
    available: true,
    navGroup: "memories",
  },
  {
    slug: "recipes",
    name: "Recipes",
    description:
      "Save family recipes so they're never lost. Grandma's cookies, dad's chili, all of it.",
    category: "memories",
    icon: "\u{1F373}",
    href: "/dashboard/recipes",
    available: true,
    navGroup: "memories",
  },
  {
    slug: "voice-memos",
    name: "Voice Memos",
    description:
      "Record voices, laughter, and stories. The sounds your family will want to hear again someday.",
    category: "memories",
    icon: "\u{1F3A4}",
    href: "/dashboard/voice-memos",
    available: true,
    navGroup: "memories",
  },
  {
    slug: "one-line",
    name: "One Line A Day",
    description:
      "A single sentence each day. Simple, consistent, and surprisingly powerful over time.",
    category: "memories",
    icon: "\u{270D}\u{FE0F}",
    href: "/dashboard/one-line",
    available: true,
    navGroup: "memories",
  },
  {
    slug: "artwork",
    name: "Artwork",
    description:
      "Photograph and preserve your kids' drawings, paintings, and crafts before they get lost.",
    category: "memories",
    icon: "\u{1F3A8}",
    href: "/dashboard/artwork",
    available: true,
    navGroup: "memories",
  },
  {
    slug: "baby-book",
    name: "Baby Book",
    description:
      "A year-by-year photo book for each child. Five photos per year — watch them grow up one year at a time.",
    category: "memories",
    icon: "\u{1F476}",
    href: "/dashboard/baby-book",
    available: true,
    navGroup: "memories",
  },
  {
    slug: "trophy-case",
    name: "Trophy Case",
    description:
      "Celebrate milestones, awards, and achievements. Every family member gets their own shelf.",
    category: "memories",
    icon: "\u{1F3C6}",
    href: "/dashboard/trophy-case",
    available: true,
    navGroup: "memories",
  },
  {
    slug: "time-capsules",
    name: "Time Capsules",
    description:
      "Write letters to the future. Set a date, seal it, and open it together when the time comes.",
    category: "memories",
    icon: "\u{1F4E6}",
    href: "/dashboard/time-capsules",
    available: true,
    navGroup: "family",
  },

  // Memories & Stories (continued)
  {
    slug: "ancestry-stories",
    name: "Ancestry Stories",
    description:
      "Capture where your family came from. Immigration journeys, family origins, and the stories behind your name.",
    category: "memories",
    icon: "\u{1F333}",
    href: "/dashboard/ancestry-stories",
    available: false,
    navGroup: "memories",
  },

  // Family Life (opt-in)
  {
    slug: "favourites",
    name: "Favourites",
    description:
      "Track your family's favourite books, movies, music, games, shows, and toys. Everyone adds their own picks.",
    category: "family-life",
    icon: "\u{2764}\u{FE0F}",
    href: "/dashboard/favourites",
    available: true,
  },
  {
    slug: "traditions",
    name: "Traditions",
    description:
      "Document the traditions that make your family yours. Pancake Sundays, holiday rituals, and everything in between.",
    category: "family-life",
    icon: "\u{1F56F}\u{FE0F}",
    href: "/dashboard/traditions",
    available: true,
  },
  {
    slug: "family-motto",
    name: "Family Motto & Values",
    description:
      "Write your family's motto and the values you want to pass down. Simple, visible, and yours.",
    category: "family-life",
    icon: "\u{1F4DC}",
    href: "/dashboard/family-motto",
    available: false,
  },
  {
    slug: "gratitude-board",
    name: "Gratitude Board",
    description:
      "A shared space to post what each family member is grateful for. A small habit that adds up.",
    category: "family-life",
    icon: "\u{1F31F}",
    href: "/dashboard/gratitude-board",
    available: false,
  },
  {
    slug: "book-club",
    name: "Family Book Club",
    description:
      "Track what everyone is reading, share ratings, and set the family pick. One shelf, every reader.",
    category: "family-life",
    icon: "\u{1F4DA}",
    href: "/dashboard/book-club",
    available: true,
  },

  // Games & Challenges
  {
    slug: "family-trivia",
    name: "Family Trivia",
    description:
      "Quiz your family with trivia questions. Covers history, pop culture, science, and more — all family-friendly.",
    category: "games",
    icon: "\u{1F9E0}",
    href: "/dashboard/family-trivia",
    available: false,
  },
  {
    slug: "family-challenges",
    name: "Family Challenges",
    description:
      "Set goals your family tackles together. One-time challenges or daily streaks — track who's in.",
    category: "games",
    icon: "\u{1F3AF}",
    href: "/dashboard/challenges",
    available: true,
  },

  // Goals & Lists
  {
    slug: "bucket-list",
    name: "Bucket List",
    description:
      "Dream big together. Track the adventures, goals, and milestones your family wants to reach.",
    category: "goals",
    icon: "\u{1F31F}",
    href: "/dashboard/bucket-list",
    available: true,
  },

  // Planning & Events
  {
    slug: "reunion-planner",
    name: "Reunion Planner",
    description:
      "Coordinate dates, RSVPs, and who's bringing what for your next family gathering.",
    category: "planning",
    icon: "\u{1F389}",
    href: "/dashboard/tools/reunion-planner",
    available: true,
  },
  {
    slug: "gift-exchange",
    name: "Gift Exchange",
    description:
      "Secret Santa draws, wishlists, and budget tracking for the holidays.",
    category: "planning",
    icon: "\u{1F381}",
    href: "/dashboard/tools/gift-exchange",
    available: true,
  },
  {
    slug: "trip-planner",
    name: "Trip Planner",
    description:
      "Build itineraries, packing lists, and coordinate travel logistics together.",
    category: "planning",
    icon: "\u{2708}\u{FE0F}",
    href: "/dashboard/tools/trip-planner",
    available: true,
  },

  // Travel & Adventure
  {
    slug: "mlb-stadium-tour",
    name: "MLB Stadium Tour",
    description:
      "Track every ballpark your family has visited. Pin stadiums on the map and add photos from each game.",
    category: "travel",
    icon: "\u{26BE}",
    href: "/dashboard/tools/mlb-stadium-tour",
    available: true,
  },
  {
    slug: "fishing-map",
    name: "Fishing Map",
    description:
      "Pin your favourite fishing spots, log your catches, and build a family fishing journal.",
    category: "travel",
    icon: "\u{1F3A3}",
    href: "/dashboard/tools/fishing-map",
    available: true,
  },
  {
    slug: "national-parks",
    name: "National Parks Tracker",
    description:
      "Check off the parks you've visited, plan your next trip, and save photos from each adventure.",
    category: "travel",
    icon: "\u{1F3D5}\u{FE0F}",
    href: "/dashboard/tools/national-parks",
    available: true,
  },

  // Family Essentials
  {
    slug: "emergency-info",
    name: "Emergency Info",
    description:
      "Keep medical contacts, allergies, insurance, and important numbers in one place.",
    category: "essentials",
    icon: "\u{1F3E5}",
    href: "/dashboard/tools/emergency-info",
    available: true,
  },
];

/** Look up a catalog feature by slug */
export function getFeatureBySlug(slug: string): CatalogFeature | undefined {
  return FEATURE_CATALOG.find((f) => f.slug === slug);
}

/** Get all features grouped by category (in display order) */
export function getFeaturesByCategory(): {
  category: FeatureCategory;
  label: string;
  features: CatalogFeature[];
}[] {
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    features: FEATURE_CATALOG.filter((f) => f.category === cat),
  }));
}
