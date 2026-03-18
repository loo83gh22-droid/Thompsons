export type PresetLocation = {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type AdventureConfig = {
  featureSlug: string;
  title: string;
  subtitle: string;
  icon: string;
  presetLocations: PresetLocation[];
  allowCustomLocations: boolean;
};

/* ------------------------------------------------------------------ */
/*  MLB Team + Stadium types                                           */
/* ------------------------------------------------------------------ */

export type MlbStadium = {
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  years: string;
  current: boolean;
};

export type MlbTeam = {
  team: string;
  league: "AL" | "NL";
  division: "East" | "Central" | "West";
  stadiums: MlbStadium[];
};

/* ------------------------------------------------------------------ */
/*  MLB Teams & Stadiums (1950+, physical venue changes only)          */
/* ------------------------------------------------------------------ */

export const MLB_TEAMS: MlbTeam[] = [
  // AL East
  {
    team: "Baltimore Orioles",
    league: "AL",
    division: "East",
    stadiums: [
      { name: "Oriole Park at Camden Yards", city: "Baltimore, MD", latitude: 39.2838, longitude: -76.6216, years: "1992-present", current: true },
      { name: "Memorial Stadium", city: "Baltimore, MD", latitude: 39.3233, longitude: -76.5936, years: "1954-1991", current: false },
    ],
  },
  {
    team: "Boston Red Sox",
    league: "AL",
    division: "East",
    stadiums: [
      { name: "Fenway Park", city: "Boston, MA", latitude: 42.3467, longitude: -71.0972, years: "1912-present", current: true },
    ],
  },
  {
    team: "New York Yankees",
    league: "AL",
    division: "East",
    stadiums: [
      { name: "Yankee Stadium", city: "Bronx, NY", latitude: 40.8296, longitude: -73.9262, years: "2009-present", current: true },
      { name: "Old Yankee Stadium", city: "Bronx, NY", latitude: 40.8267, longitude: -73.9269, years: "1923-2008", current: false },
    ],
  },
  {
    team: "Tampa Bay Rays",
    league: "AL",
    division: "East",
    stadiums: [
      { name: "Tropicana Field", city: "St. Petersburg, FL", latitude: 27.7682, longitude: -82.6534, years: "1998-present", current: true },
    ],
  },
  {
    team: "Toronto Blue Jays",
    league: "AL",
    division: "East",
    stadiums: [
      { name: "Rogers Centre", city: "Toronto, ON", latitude: 43.6414, longitude: -79.3894, years: "1989-present", current: true },
      { name: "Exhibition Stadium", city: "Toronto, ON", latitude: 43.6316, longitude: -79.4153, years: "1977-1989", current: false },
    ],
  },

  // AL Central
  {
    team: "Chicago White Sox",
    league: "AL",
    division: "Central",
    stadiums: [
      { name: "Guaranteed Rate Field", city: "Chicago, IL", latitude: 41.8299, longitude: -87.6338, years: "1991-present", current: true },
      { name: "Old Comiskey Park", city: "Chicago, IL", latitude: 41.8311, longitude: -87.6339, years: "1910-1990", current: false },
    ],
  },
  {
    team: "Cleveland Guardians",
    league: "AL",
    division: "Central",
    stadiums: [
      { name: "Progressive Field", city: "Cleveland, OH", latitude: 41.4962, longitude: -81.6852, years: "1994-present", current: true },
      { name: "Cleveland Stadium", city: "Cleveland, OH", latitude: 41.5117, longitude: -81.6997, years: "1932-1993", current: false },
    ],
  },
  {
    team: "Detroit Tigers",
    league: "AL",
    division: "Central",
    stadiums: [
      { name: "Comerica Park", city: "Detroit, MI", latitude: 42.339, longitude: -83.0485, years: "2000-present", current: true },
      { name: "Tiger Stadium", city: "Detroit, MI", latitude: 42.3317, longitude: -83.0683, years: "1912-1999", current: false },
    ],
  },
  {
    team: "Kansas City Royals",
    league: "AL",
    division: "Central",
    stadiums: [
      { name: "Kauffman Stadium", city: "Kansas City, MO", latitude: 39.0517, longitude: -94.4803, years: "1973-present", current: true },
      { name: "Municipal Stadium", city: "Kansas City, MO", latitude: 39.0722, longitude: -94.5547, years: "1969-1972", current: false },
    ],
  },
  {
    team: "Minnesota Twins",
    league: "AL",
    division: "Central",
    stadiums: [
      { name: "Target Field", city: "Minneapolis, MN", latitude: 44.9818, longitude: -93.2775, years: "2010-present", current: true },
      { name: "Metrodome", city: "Minneapolis, MN", latitude: 44.9738, longitude: -93.2580, years: "1982-2009", current: false },
      { name: "Metropolitan Stadium", city: "Bloomington, MN", latitude: 44.8558, longitude: -93.2389, years: "1961-1981", current: false },
    ],
  },

  // AL West
  {
    team: "Houston Astros",
    league: "AL",
    division: "West",
    stadiums: [
      { name: "Minute Maid Park", city: "Houston, TX", latitude: 29.7573, longitude: -95.3555, years: "2000-present", current: true },
      { name: "Astrodome", city: "Houston, TX", latitude: 29.6847, longitude: -95.4107, years: "1965-1999", current: false },
    ],
  },
  {
    team: "Los Angeles Angels",
    league: "AL",
    division: "West",
    stadiums: [
      { name: "Angel Stadium", city: "Anaheim, CA", latitude: 33.8003, longitude: -117.8827, years: "1966-present", current: true },
      { name: "Wrigley Field (LA)", city: "Los Angeles, CA", latitude: 33.9883, longitude: -118.2897, years: "1961-1965", current: false },
    ],
  },
  {
    team: "Oakland Athletics",
    league: "AL",
    division: "West",
    stadiums: [
      { name: "Oakland Coliseum", city: "Oakland, CA", latitude: 37.7516, longitude: -122.2005, years: "1968-2024", current: false },
      { name: "Sutter Health Park", city: "Sacramento, CA", latitude: 38.5802, longitude: -121.5099, years: "2025-present", current: true },
      { name: "Municipal Stadium (KC)", city: "Kansas City, MO", latitude: 39.0722, longitude: -94.5547, years: "1955-1967", current: false },
    ],
  },
  {
    team: "Seattle Mariners",
    league: "AL",
    division: "West",
    stadiums: [
      { name: "T-Mobile Park", city: "Seattle, WA", latitude: 47.5914, longitude: -122.3325, years: "1999-present", current: true },
      { name: "Kingdome", city: "Seattle, WA", latitude: 47.5950, longitude: -122.3316, years: "1977-1999", current: false },
    ],
  },
  {
    team: "Texas Rangers",
    league: "AL",
    division: "West",
    stadiums: [
      { name: "Globe Life Field", city: "Arlington, TX", latitude: 32.7473, longitude: -97.0845, years: "2020-present", current: true },
      { name: "Globe Life Park", city: "Arlington, TX", latitude: 32.7512, longitude: -97.0832, years: "1994-2019", current: false },
      { name: "Arlington Stadium", city: "Arlington, TX", latitude: 32.7510, longitude: -97.0820, years: "1972-1993", current: false },
    ],
  },

  // NL East
  {
    team: "Atlanta Braves",
    league: "NL",
    division: "East",
    stadiums: [
      { name: "Truist Park", city: "Atlanta, GA", latitude: 33.8907, longitude: -84.4677, years: "2017-present", current: true },
      { name: "Turner Field", city: "Atlanta, GA", latitude: 33.7353, longitude: -84.3894, years: "1997-2016", current: false },
      { name: "Atlanta-Fulton County Stadium", city: "Atlanta, GA", latitude: 33.7358, longitude: -84.3896, years: "1966-1996", current: false },
      { name: "Milwaukee County Stadium", city: "Milwaukee, WI", latitude: 43.0303, longitude: -87.9711, years: "1953-1965", current: false },
    ],
  },
  {
    team: "Miami Marlins",
    league: "NL",
    division: "East",
    stadiums: [
      { name: "loanDepot park", city: "Miami, FL", latitude: 25.7781, longitude: -80.2196, years: "2012-present", current: true },
      { name: "Sun Life Stadium", city: "Miami, FL", latitude: 25.9580, longitude: -80.2389, years: "1993-2011", current: false },
    ],
  },
  {
    team: "New York Mets",
    league: "NL",
    division: "East",
    stadiums: [
      { name: "Citi Field", city: "Queens, NY", latitude: 40.7571, longitude: -73.8458, years: "2009-present", current: true },
      { name: "Shea Stadium", city: "Queens, NY", latitude: 40.7566, longitude: -73.8458, years: "1964-2008", current: false },
      { name: "Polo Grounds", city: "New York, NY", latitude: 40.8506, longitude: -73.9378, years: "1962-1963", current: false },
    ],
  },
  {
    team: "Philadelphia Phillies",
    league: "NL",
    division: "East",
    stadiums: [
      { name: "Citizens Bank Park", city: "Philadelphia, PA", latitude: 39.9061, longitude: -75.1665, years: "2004-present", current: true },
      { name: "Veterans Stadium", city: "Philadelphia, PA", latitude: 39.9058, longitude: -75.1708, years: "1971-2003", current: false },
      { name: "Connie Mack Stadium", city: "Philadelphia, PA", latitude: 39.9907, longitude: -75.1530, years: "1938-1970", current: false },
    ],
  },
  {
    team: "Washington Nationals",
    league: "NL",
    division: "East",
    stadiums: [
      { name: "Nationals Park", city: "Washington, DC", latitude: 38.8730, longitude: -77.0074, years: "2008-present", current: true },
      { name: "RFK Stadium", city: "Washington, DC", latitude: 38.8900, longitude: -76.9717, years: "2005-2007", current: false },
      { name: "Olympic Stadium", city: "Montreal, QC", latitude: 45.5579, longitude: -73.5512, years: "1977-2004", current: false },
      { name: "Jarry Park", city: "Montreal, QC", latitude: 45.5346, longitude: -73.6210, years: "1969-1976", current: false },
    ],
  },

  // NL Central
  {
    team: "Chicago Cubs",
    league: "NL",
    division: "Central",
    stadiums: [
      { name: "Wrigley Field", city: "Chicago, IL", latitude: 41.9484, longitude: -87.6553, years: "1916-present", current: true },
    ],
  },
  {
    team: "Cincinnati Reds",
    league: "NL",
    division: "Central",
    stadiums: [
      { name: "Great American Ball Park", city: "Cincinnati, OH", latitude: 39.0974, longitude: -84.5082, years: "2003-present", current: true },
      { name: "Riverfront Stadium", city: "Cincinnati, OH", latitude: 39.0959, longitude: -84.5086, years: "1970-2002", current: false },
      { name: "Crosley Field", city: "Cincinnati, OH", latitude: 39.1085, longitude: -84.5253, years: "1912-1970", current: false },
    ],
  },
  {
    team: "Milwaukee Brewers",
    league: "NL",
    division: "Central",
    stadiums: [
      { name: "American Family Field", city: "Milwaukee, WI", latitude: 43.0280, longitude: -87.9712, years: "2001-present", current: true },
      { name: "Milwaukee County Stadium", city: "Milwaukee, WI", latitude: 43.0303, longitude: -87.9711, years: "1970-2000", current: false },
    ],
  },
  {
    team: "Pittsburgh Pirates",
    league: "NL",
    division: "Central",
    stadiums: [
      { name: "PNC Park", city: "Pittsburgh, PA", latitude: 40.4469, longitude: -80.0058, years: "2001-present", current: true },
      { name: "Three Rivers Stadium", city: "Pittsburgh, PA", latitude: 40.4467, longitude: -80.0123, years: "1970-2000", current: false },
      { name: "Forbes Field", city: "Pittsburgh, PA", latitude: 40.4417, longitude: -79.9536, years: "1909-1970", current: false },
    ],
  },
  {
    team: "St. Louis Cardinals",
    league: "NL",
    division: "Central",
    stadiums: [
      { name: "Busch Stadium", city: "St. Louis, MO", latitude: 38.6226, longitude: -90.1928, years: "2006-present", current: true },
      { name: "Busch Memorial Stadium", city: "St. Louis, MO", latitude: 38.6228, longitude: -90.1937, years: "1966-2005", current: false },
      { name: "Sportsman's Park", city: "St. Louis, MO", latitude: 38.6396, longitude: -90.2122, years: "1920-1966", current: false },
    ],
  },

  // NL West
  {
    team: "Arizona Diamondbacks",
    league: "NL",
    division: "West",
    stadiums: [
      { name: "Chase Field", city: "Phoenix, AZ", latitude: 33.4455, longitude: -112.0667, years: "1998-present", current: true },
    ],
  },
  {
    team: "Colorado Rockies",
    league: "NL",
    division: "West",
    stadiums: [
      { name: "Coors Field", city: "Denver, CO", latitude: 39.7559, longitude: -104.9942, years: "1995-present", current: true },
      { name: "Mile High Stadium", city: "Denver, CO", latitude: 39.7438, longitude: -105.0201, years: "1993-1994", current: false },
    ],
  },
  {
    team: "Los Angeles Dodgers",
    league: "NL",
    division: "West",
    stadiums: [
      { name: "Dodger Stadium", city: "Los Angeles, CA", latitude: 34.0739, longitude: -118.2400, years: "1962-present", current: true },
      { name: "Los Angeles Memorial Coliseum", city: "Los Angeles, CA", latitude: 34.0141, longitude: -118.2879, years: "1958-1961", current: false },
      { name: "Ebbets Field", city: "Brooklyn, NY", latitude: 40.6625, longitude: -73.9572, years: "1913-1957", current: false },
    ],
  },
  {
    team: "San Diego Padres",
    league: "NL",
    division: "West",
    stadiums: [
      { name: "Petco Park", city: "San Diego, CA", latitude: 32.7076, longitude: -117.1570, years: "2004-present", current: true },
      { name: "Qualcomm Stadium", city: "San Diego, CA", latitude: 32.7831, longitude: -117.1196, years: "1969-2003", current: false },
    ],
  },
  {
    team: "San Francisco Giants",
    league: "NL",
    division: "West",
    stadiums: [
      { name: "Oracle Park", city: "San Francisco, CA", latitude: 37.7786, longitude: -122.3893, years: "2000-present", current: true },
      { name: "Candlestick Park", city: "San Francisco, CA", latitude: 37.7133, longitude: -122.3864, years: "1960-1999", current: false },
      { name: "Polo Grounds", city: "New York, NY", latitude: 40.8506, longitude: -73.9378, years: "1911-1957", current: false },
    ],
  },
];

/** Flatten MLB teams into flat PresetLocation[] for backward compat */
export const MLB_STADIUMS: PresetLocation[] = MLB_TEAMS.flatMap((t) =>
  t.stadiums.filter((s) => s.current).map((s) => ({
    name: s.name,
    description: s.city,
    latitude: s.latitude,
    longitude: s.longitude,
  })),
);

/* ------------------------------------------------------------------ */
/*  National Parks - Top 20 most popular US National Parks             */
/* ------------------------------------------------------------------ */

export const NATIONAL_PARKS: PresetLocation[] = [
  { name: "Yellowstone", description: "Wyoming / Montana / Idaho", latitude: 44.4280, longitude: -110.5885 },
  { name: "Yosemite", description: "California", latitude: 37.8651, longitude: -119.5383 },
  { name: "Grand Canyon", description: "Arizona", latitude: 36.1069, longitude: -112.1129 },
  { name: "Zion", description: "Utah", latitude: 37.2982, longitude: -113.0263 },
  { name: "Rocky Mountain", description: "Colorado", latitude: 40.3428, longitude: -105.6836 },
  { name: "Acadia", description: "Maine", latitude: 44.3386, longitude: -68.2733 },
  { name: "Grand Teton", description: "Wyoming", latitude: 43.7904, longitude: -110.6818 },
  { name: "Olympic", description: "Washington", latitude: 47.8021, longitude: -123.6044 },
  { name: "Glacier", description: "Montana", latitude: 48.7596, longitude: -113.7870 },
  { name: "Joshua Tree", description: "California", latitude: 33.8734, longitude: -115.9010 },
  { name: "Bryce Canyon", description: "Utah", latitude: 37.5930, longitude: -112.1871 },
  { name: "Arches", description: "Utah", latitude: 38.7331, longitude: -109.5925 },
  { name: "Canyonlands", description: "Utah", latitude: 38.2136, longitude: -109.9025 },
  { name: "Great Smoky Mountains", description: "Tennessee / North Carolina", latitude: 35.6118, longitude: -83.4895 },
  { name: "Shenandoah", description: "Virginia", latitude: 38.5329, longitude: -78.3514 },
  { name: "Mount Rainier", description: "Washington", latitude: 46.8523, longitude: -121.7603 },
  { name: "Death Valley", description: "California / Nevada", latitude: 36.5054, longitude: -117.0794 },
  { name: "Sequoia", description: "California", latitude: 36.4864, longitude: -118.5658 },
  { name: "Denali", description: "Alaska", latitude: 63.1148, longitude: -151.1926 },
  { name: "Everglades", description: "Florida", latitude: 25.2866, longitude: -80.8987 },
];

/* ------------------------------------------------------------------ */
/*  Feature configs                                                    */
/* ------------------------------------------------------------------ */

export const MLB_CONFIG: AdventureConfig = {
  featureSlug: "mlb-stadium-tour",
  title: "MLB Stadium Tour",
  subtitle: "Track every ballpark you visit across the league",
  icon: "baseball",
  presetLocations: MLB_STADIUMS,
  allowCustomLocations: false,
};

export const FISHING_CONFIG: AdventureConfig = {
  featureSlug: "fishing-map",
  title: "Fishing Map",
  subtitle: "Log your favourite fishing spots and catches",
  icon: "fish",
  presetLocations: [],
  allowCustomLocations: true,
};

export const NATIONAL_PARKS_CONFIG: AdventureConfig = {
  featureSlug: "national-parks",
  title: "National Parks Tracker",
  subtitle: "Check off the parks as you explore them",
  icon: "trees",
  presetLocations: NATIONAL_PARKS,
  allowCustomLocations: true,
};
