/**
 * Feature Catalog — single source of truth for all add-on features.
 *
 * Core features (Journal, Photos, etc.) are always visible in the nav.
 * Add-on features live here and only appear in the nav when a family
 * enables them via the Feature Catalog page (/dashboard/tools).
 */

export type FeatureCategory =
  | "features"
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
  available: boolean; // false = coming soon
}

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  features: "Features",
  goals: "Goals & Lists",
  planning: "Planning & Events",
  travel: "Travel & Adventure",
  essentials: "Family Essentials",
};

export const CATEGORY_ORDER: FeatureCategory[] = [
  "features",
  "goals",
  "planning",
  "travel",
  "essentials",
];

export const FEATURE_CATALOG: CatalogFeature[] = [
  // Features (opt-in core-style features)
  {
    slug: "favourites",
    name: "Favourites",
    description:
      "Track your family's favourite books, movies, music, games, shows, and toys. Everyone adds their own picks.",
    category: "features",
    icon: "\u{2764}\u{FE0F}",
    href: "/dashboard/favourites",
    available: true,
  },
  {
    slug: "traditions",
    name: "Traditions",
    description:
      "Document the traditions that make your family yours. Pancake Sundays, holiday rituals, and everything in between.",
    category: "features",
    icon: "\u{1F56F}\u{FE0F}",
    href: "/dashboard/traditions",
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
