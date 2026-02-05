// Light shades of national flag colors for visited countries
// Format: fill color at ~15-20% opacity for subtle shading
export const COUNTRY_FLAG_STYLES: Record<
  string,
  { fill: string; fillOpacity: number }
> = {
  MX: {
    // Mexico: green, white, red - use green as primary
    fill: "#006847",
    fillOpacity: 0.2,
  },
  CA: {
    // Canada: red, white - use red
    fill: "#ff0000",
    fillOpacity: 0.15,
  },
  US: {
    // USA: red, white, blue - use blue
    fill: "#3c3b6e",
    fillOpacity: 0.18,
  },
  GB: {
    // UK: red, white, blue
    fill: "#012169",
    fillOpacity: 0.18,
  },
  FR: {
    // France: blue, white, red
    fill: "#002395",
    fillOpacity: 0.18,
  },
  ES: {
    // Spain: red, yellow
    fill: "#c60b1e",
    fillOpacity: 0.18,
  },
  IT: {
    // Italy: green, white, red
    fill: "#009246",
    fillOpacity: 0.18,
  },
  JP: {
    // Japan: white, red
    fill: "#bc002d",
    fillOpacity: 0.18,
  },
  AU: {
    // Australia: blue
    fill: "#012169",
    fillOpacity: 0.18,
  },
  DE: {
    // Germany: black, red, gold
    fill: "#000000",
    fillOpacity: 0.15,
  },
  BR: {
    // Brazil: green, yellow
    fill: "#009739",
    fillOpacity: 0.18,
  },
  CN: {
    // China: red, yellow
    fill: "#de2910",
    fillOpacity: 0.18,
  },
  IN: {
    // India: saffron, white, green
    fill: "#ff9933",
    fillOpacity: 0.18,
  },
};
