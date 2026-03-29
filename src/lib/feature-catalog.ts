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
  highlights?: string[];
  /** Which nav dropdown this feature appears in when enabled */
  navGroup?: "memories" | "family" | "activities" | "organise";
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
  {
    slug: "family-letters",
    name: "Letters",
    description: "Write personal letters to family members — to be read now or someday.",
    category: "memories",
    icon: "\u{1F4DD}",
    href: "/dashboard/letters",
    available: true,
    navGroup: "memories",
    highlights: [
      "Write a letter addressed to someone you love",
      "Optionally seal it until they reach a certain age",
      "Always private — never shared outside the nest",
    ],
  },
  {
    slug: "stories",
    name: "Stories",
    description: "Write and preserve family stories, passed down through generations.",
    category: "memories",
    icon: "\u{1F4D6}",
    href: "/dashboard/stories",
    available: true,
    navGroup: "memories",
    highlights: [
      "Write multi-paragraph stories with a cover photo",
      "Tag which family members are in the story",
      "Browse by category: History, Wisdom, Traditions, and more",
      "Share publicly with a link, or keep it private",
    ],
  },
  {
    slug: "recipes",
    name: "Recipes",
    description: "Save family recipes so they're never lost. Grandma's cookies, dad's chili, all of it.",
    category: "memories",
    icon: "\u{1F373}",
    href: "/dashboard/recipes",
    available: true,
    navGroup: "memories",
    highlights: [
      "Save recipes with the story behind them",
      "Add dinner photos alongside the recipe",
      "Share via link with anyone outside the family",
      "Never lose the recipe only grandma knew",
    ],
  },
  {
    slug: "voice-memos",
    name: "Voice Memos",
    description: "Record voices, laughter, and stories. The sounds your family will want to hear again someday.",
    category: "memories",
    icon: "\u{1F3A4}",
    href: "/dashboard/voice-memos",
    available: true,
    navGroup: "memories",
    highlights: [
      "Record voices, songs, and stories directly in the app",
      "Listen back months or years later",
      "Capture laughs, accents, and things words can't describe",
    ],
  },
  {
    slug: "one-line",
    name: "One Line A Day",
    description: "A single sentence each day. Simple, consistent, and surprisingly powerful over time.",
    category: "memories",
    icon: "\u{270D}\u{FE0F}",
    href: "/dashboard/one-line",
    available: true,
    navGroup: "memories",
    highlights: [
      "One sentence per day, per person",
      "Look back across months and years",
      "Takes 10 seconds — the consistency is the magic",
    ],
  },
  {
    slug: "artwork",
    name: "Artwork",
    description: "Photograph and preserve your kids' drawings, paintings, and crafts before they get lost.",
    category: "memories",
    icon: "\u{1F3A8}",
    href: "/dashboard/artwork",
    available: true,
    navGroup: "memories",
    highlights: [
      "Photograph and store kids' drawings and crafts",
      "Organized by child and date automatically",
      "Share with grandparents and distant family",
    ],
  },
  {
    slug: "baby-book",
    name: "Baby Book",
    description: "A year-by-year photo book for each child. Five photos per year — watch them grow up one year at a time.",
    category: "memories",
    icon: "\u{1F476}",
    href: "/dashboard/baby-book",
    available: true,
    navGroup: "memories",
    highlights: [
      "5 photos per year, per child",
      "Watch them grow up one year at a time",
      "Add birth details and a note for each year",
    ],
  },
  {
    slug: "trophy-case",
    name: "Trophy Case",
    description: "Celebrate milestones, awards, and achievements. Every family member gets their own shelf.",
    category: "memories",
    icon: "\u{1F3C6}",
    href: "/dashboard/trophy-case",
    available: true,
    navGroup: "memories",
    highlights: [
      "Celebrate every win — sports, school, personal",
      "Every family member gets their own shelf",
      "Add photos and notes for each achievement",
    ],
  },
  {
    slug: "time-capsules",
    name: "Time Capsules",
    description: "Write letters to the future. Set a date, seal it, and open it together when the time comes.",
    category: "memories",
    icon: "\u{1F4E6}",
    href: "/dashboard/time-capsules",
    available: true,
    navGroup: "family",
    highlights: [
      "Write letters to your future self or your family",
      "Lock it until a date you choose",
      "Open it together when the time comes",
    ],
  },

  // Family Life
  {
    slug: "favourites",
    name: "Favourites",
    description: "Track your family's favourite books, movies, music, games, shows, and toys. Everyone adds their own picks.",
    category: "family-life",
    icon: "\u{2764}\u{FE0F}",
    href: "/dashboard/favourites",
    available: true,
    navGroup: "family",
    highlights: [
      "Track books, movies, shows, games, and music",
      "Everyone adds and updates their own current picks",
      "See what the whole family is into right now",
      "Shared picks show up as Family Favourites",
    ],
  },
  {
    slug: "traditions",
    name: "Traditions",
    description: "Document the traditions that make your family yours. Pancake Sundays, holiday rituals, and everything in between.",
    category: "family-life",
    icon: "\u{1F56F}\u{FE0F}",
    href: "/dashboard/traditions",
    available: true,
    navGroup: "family",
    highlights: [
      "Document the rituals that make your family yours",
      "Annual, seasonal, and weekly traditions",
      "Add photos and notes to each one",
    ],
  },
  {
    slug: "family-motto",
    name: "Family Motto & Values",
    description: "Write your family's motto and the values you want to pass down. Simple, visible, and yours.",
    category: "family-life",
    icon: "\u{1F4DC}",
    href: "/dashboard/family-motto",
    available: true,
    navGroup: "family",
    highlights: [
      "Write your family's guiding motto in your own words",
      "Add the values your family lives by",
      "Each member can add their own personal take",
      "Personal notes show on each member's profile",
    ],
  },
  {
    slug: "gratitude-board",
    name: "Gratitude Board",
    description: "A shared space to post what each family member is grateful for. A small habit that adds up.",
    category: "family-life",
    icon: "\u{1F31F}",
    href: "/dashboard/gratitude-board",
    available: true,
    navGroup: "family",
    highlights: [
      "Post what you're grateful for — short and sweet",
      "The whole family can read and add to it",
      "One gratitude surfaces on your home screen each day",
    ],
  },
  {
    slug: "book-club",
    name: "Family Book Club",
    description: "Track what everyone is reading, share ratings, and set the family pick. One shelf, every reader.",
    category: "family-life",
    icon: "\u{1F4DA}",
    href: "/dashboard/book-club",
    available: true,
    navGroup: "family",
    highlights: [
      "Track what everyone is reading right now",
      "Rate and review finished books",
      "Pin one book as the Family Pick for everyone to read",
    ],
  },

  {
    slug: "our-teams",
    name: "Our Teams",
    description: "Document every season, club, and team your family has been part of — with photos, write-ups, and a map pin for where you played.",
    category: "family-life",
    icon: "\u{1F3C5}",
    href: "/dashboard/teams",
    available: true,
    navGroup: "activities",
    highlights: [
      "One entry per team or season — sport, year, and city",
      "Up to 20 photos per team with a cover shot",
      "Tag each family member with their role (Player, Coach, etc.)",
      "Automatically pins the city to your Family Map",
    ],
  },
  {
    slug: "family-quotes",
    name: "Family Quotes",
    description: "Capture the things your family actually says. Kids say the wildest things — write them down before you forget.",
    category: "memories",
    icon: "\u{1F4AC}",
    href: "/dashboard/quotes",
    available: true,
    navGroup: "memories",
    highlights: [
      "Capture funny, sweet, or unforgettable quotes",
      "Tag who said it and when",
      "Add the story behind the quote",
    ],
  },
  {
    slug: "family-predictions",
    name: "Family Predictions",
    description: "Pose a question, everyone adds their prediction, then reveal the answer when the time comes.",
    category: "memories",
    icon: "\u{1F52E}",
    href: "/dashboard/predictions",
    available: true,
    navGroup: "memories",
    highlights: [
      "Anyone in the family can add their own prediction",
      "Set a target date for when you'll know the answer",
      "Mark who got it right and reveal the outcome",
    ],
  },
  {
    slug: "awards-night",
    name: "Family Awards Night",
    description: "Give out awards — heartfelt or hilarious. Every family has someone who deserves recognition (or a gentle roast).",
    category: "memories",
    icon: "\u{1F3C6}",
    href: "/dashboard/awards-night",
    available: true,
    navGroup: "family",
    highlights: [
      "Give awards any time, for any reason",
      "Mark awards as heartfelt or a roast",
      "Nudges you to host an annual Family Awards Night",
      "Browse by year — a trophy shelf for the ages",
    ],
  },
  {
    slug: "our-homes",
    name: "Our Homes",
    description: "Document every place your family has called home — from childhood houses to where you live now.",
    category: "family-life",
    icon: "\u{1F3E1}",
    href: "/dashboard/homes",
    available: true,
    navGroup: "family",
    highlights: [
      "Add every home with years lived there and a city",
      "Tag which family members lived there",
      "Up to 20 photos per home",
      "City automatically pins to your Family Map",
    ],
  },
  {
    slug: "family-films",
    name: "Family Films",
    description: "Track movies and series — what you want to watch, are watching, and have seen together.",
    category: "family-life",
    icon: "\u{1F3AC}",
    href: "/dashboard/films",
    available: true,
    navGroup: "family",
    highlights: [
      "Separate movies from series",
      "Track Want to Watch / Watching / Watched status",
      "Rate and add notes to what you've seen",
      "Pin a Family Pick that everyone should watch",
    ],
  },
  {
    slug: "game-night",
    name: "Game Night Log",
    description: "Log every game night, track winners, and see who's on top of the family leaderboard.",
    category: "games",
    icon: "\u{1F3B2}",
    href: "/dashboard/game-night",
    available: true,
    navGroup: "activities",
    highlights: [
      "Log sessions with date, game, and winner",
      "Add any game — Catan, Yahtzee, anything",
      "Leaderboard tracks all-time wins",
    ],
  },
  {
    slug: "volunteer-log",
    name: "Volunteer Log",
    description: "Document the causes your family cares about and the time you've given. Build a record of giving back.",
    category: "family-life",
    icon: "\u{1F91D}",
    href: "/dashboard/volunteer",
    available: true,
    navGroup: "activities",
    highlights: [
      "Log volunteer sessions with hours and organization",
      "Tag causes and who volunteered",
      "Total hours tracked across the family",
      "City pins to your Family Map",
    ],
  },
  {
    slug: "family-garden",
    name: "Family Garden",
    description: "Document what you grow, season by season — whether you're tracking yields or just growing things for joy.",
    category: "family-life",
    icon: "\u{1F331}",
    href: "/dashboard/garden",
    available: true,
    navGroup: "activities",
    highlights: [
      "One entry per season with a plant list",
      "Track vegetable yields or just capture what bloomed",
      "Up to 20 photos per season",
      "Works for serious growers and joy gardeners alike",
    ],
  },

  // Games & Challenges
  {
    slug: "family-trivia",
    name: "Family Trivia",
    description: "Quiz your family with trivia questions. Covers history, pop culture, science, and more — all family-friendly.",
    category: "games",
    icon: "\u{1F9E0}",
    href: "/dashboard/family-trivia",
    available: false,
    navGroup: "activities",
    highlights: [
      "Public trivia only — never pulls from your private family data",
      "History, science, pop culture, and geography",
      "Track scores per member",
    ],
  },
  {
    slug: "family-challenges",
    name: "Family Challenges",
    description: "Set goals your family tackles together. One-time challenges or daily streaks — track who's in.",
    category: "games",
    icon: "\u{1F3AF}",
    href: "/dashboard/challenges",
    available: true,
    navGroup: "activities",
    highlights: [
      "One-time goals or daily streak challenges",
      "See who has checked in across the family",
      "Starter challenges included so you're never starting from scratch",
    ],
  },

  // Goals & Lists
  {
    slug: "bucket-list",
    name: "Bucket List",
    description: "Dream big together. Track the adventures, goals, and milestones your family wants to reach.",
    category: "goals",
    icon: "\u{1F31F}",
    href: "/dashboard/bucket-list",
    available: true,
    navGroup: "activities",
    highlights: [
      "Dream big together as a family",
      "Check things off as you complete them",
      "Adventures, travel, goals, and personal milestones",
    ],
  },

  // Planning & Events
  {
    slug: "trip-planner",
    name: "Trip Planner",
    description: "Build itineraries, packing lists, and coordinate travel logistics together.",
    category: "planning",
    icon: "\u{2708}\u{FE0F}",
    href: "/dashboard/tools/trip-planner",
    available: true,
    navGroup: "organise",
    highlights: [
      "Build itineraries together before you go",
      "Collaborative packing lists",
      "Everyone can see the plan in one place",
    ],
  },

  // Travel & Adventure
  {
    slug: "mlb-stadium-tour",
    name: "MLB Stadium Tour",
    description: "Track every ballpark your family has visited. Pin stadiums on the map and add photos from each game.",
    category: "travel",
    icon: "\u{26BE}",
    href: "/dashboard/tools/mlb-stadium-tour",
    available: true,
    navGroup: "activities",
    highlights: [
      "Check off every ballpark you've visited",
      "Pin them on your family map",
      "Add photos and memories from each game",
    ],
  },
  {
    slug: "fishing-map",
    name: "Fishing Map",
    description: "Pin your favourite fishing spots, log your catches, and build a family fishing journal.",
    category: "travel",
    icon: "\u{1F3A3}",
    href: "/dashboard/tools/fishing-map",
    available: true,
    navGroup: "activities",
    highlights: [
      "Pin your best fishing spots on the map",
      "Log what you caught and when",
      "Build a private family fishing journal",
    ],
  },
  {
    slug: "national-parks",
    name: "National Parks Tracker",
    description: "Check off the parks you've visited, plan your next trip, and save photos from each adventure.",
    category: "travel",
    icon: "\u{1F3D5}\u{FE0F}",
    href: "/dashboard/tools/national-parks",
    available: true,
    navGroup: "activities",
    highlights: [
      "Check off every national park you've visited",
      "Plan which ones are next on the list",
      "Save photos and memories from each visit",
    ],
  },

  // Family Essentials
  {
    slug: "emergency-info",
    name: "Emergency Info",
    description: "Keep medical contacts, allergies, insurance, and important numbers in one place.",
    category: "essentials",
    icon: "\u{1F3E5}",
    href: "/dashboard/tools/emergency-info",
    available: true,
    navGroup: "organise",
    highlights: [
      "Medical contacts, allergies, and conditions",
      "Insurance info and policy numbers",
      "Critical info available to the whole family when it's needed",
    ],
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
