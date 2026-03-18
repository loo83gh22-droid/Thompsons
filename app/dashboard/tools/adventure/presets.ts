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
/*  MLB Stadium Tour - All 30 current MLB stadiums                     */
/* ------------------------------------------------------------------ */

export const MLB_STADIUMS: PresetLocation[] = [
  { name: "Angel Stadium", description: "Anaheim, CA", latitude: 33.8003, longitude: -117.8827 },
  { name: "Busch Stadium", description: "St. Louis, MO", latitude: 38.6226, longitude: -90.1928 },
  { name: "Chase Field", description: "Phoenix, AZ", latitude: 33.4455, longitude: -112.0667 },
  { name: "Citi Field", description: "Queens, NY", latitude: 40.7571, longitude: -73.8458 },
  { name: "Citizens Bank Park", description: "Philadelphia, PA", latitude: 39.9061, longitude: -75.1665 },
  { name: "Comerica Park", description: "Detroit, MI", latitude: 42.339, longitude: -83.0485 },
  { name: "Coors Field", description: "Denver, CO", latitude: 39.7559, longitude: -104.9942 },
  { name: "Dodger Stadium", description: "Los Angeles, CA", latitude: 34.0739, longitude: -118.2400 },
  { name: "Fenway Park", description: "Boston, MA", latitude: 42.3467, longitude: -71.0972 },
  { name: "Globe Life Field", description: "Arlington, TX", latitude: 32.7473, longitude: -97.0845 },
  { name: "Great American Ball Park", description: "Cincinnati, OH", latitude: 39.0974, longitude: -84.5082 },
  { name: "Guaranteed Rate Field", description: "Chicago, IL", latitude: 41.8299, longitude: -87.6338 },
  { name: "Kauffman Stadium", description: "Kansas City, MO", latitude: 39.0517, longitude: -94.4803 },
  { name: "loanDepot park", description: "Miami, FL", latitude: 25.7781, longitude: -80.2196 },
  { name: "Minute Maid Park", description: "Houston, TX", latitude: 29.7573, longitude: -95.3555 },
  { name: "Nationals Park", description: "Washington, DC", latitude: 38.8730, longitude: -77.0074 },
  { name: "Oakland Coliseum", description: "Oakland, CA", latitude: 37.7516, longitude: -122.2005 },
  { name: "Oracle Park", description: "San Francisco, CA", latitude: 37.7786, longitude: -122.3893 },
  { name: "Oriole Park at Camden Yards", description: "Baltimore, MD", latitude: 39.2838, longitude: -76.6216 },
  { name: "Petco Park", description: "San Diego, CA", latitude: 32.7076, longitude: -117.1570 },
  { name: "PNC Park", description: "Pittsburgh, PA", latitude: 40.4469, longitude: -80.0058 },
  { name: "Progressive Field", description: "Cleveland, OH", latitude: 41.4962, longitude: -81.6852 },
  { name: "Rogers Centre", description: "Toronto, ON", latitude: 43.6414, longitude: -79.3894 },
  { name: "T-Mobile Park", description: "Seattle, WA", latitude: 47.5914, longitude: -122.3325 },
  { name: "Target Field", description: "Minneapolis, MN", latitude: 44.9818, longitude: -93.2775 },
  { name: "Tropicana Field", description: "St. Petersburg, FL", latitude: 27.7682, longitude: -82.6534 },
  { name: "Truist Park", description: "Atlanta, GA", latitude: 33.8907, longitude: -84.4677 },
  { name: "Wrigley Field", description: "Chicago, IL", latitude: 41.9484, longitude: -87.6553 },
  { name: "Yankee Stadium", description: "Bronx, NY", latitude: 40.8296, longitude: -73.9262 },
  { name: "American Family Field", description: "Milwaukee, WI", latitude: 43.0280, longitude: -87.9712 },
];

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
