import { Suspense } from "react";
import { MapPin, Camera, TrendingUp } from "lucide-react";
import { WorldMapSVG, WorldPin } from "./WorldMapSVG";

const LOCATIONS = [
  { lat: 43.65,  lng: -79.38,  label: "Toronto, Canada" },
  { lat: 37.77,  lng: -122.42, label: "San Francisco" },
  { lat: 40.71,  lng: -74.01,  label: "New York" },
  { lat: 17.99,  lng: -66.61,  label: "Puerto Rico" },   // Caribbean wedding
  { lat: 38.72,  lng:  -9.14,  label: "Lisbon, Portugal" },
  { lat: 51.51,  lng:  -0.13,  label: "London" },
  { lat: 19.08,  lng:  72.88,  label: "Mumbai, India" },
  { lat: -33.87, lng: 151.21,  label: "Sydney, Australia" },
];

const MAP_PINS: WorldPin[] = LOCATIONS.map((loc, i) => ({
  lat: loc.lat,
  lng: loc.lng,
  color: i === 3 ? "#d97706" : "#3d6b5e",
  r: 5,
}));

const CALLOUTS = [
  {
    icon: MapPin,
    heading: "Birthplaces",
    body: "Mark where every family member was born, no matter the continent.",
  },
  {
    icon: Camera,
    heading: "Vacations & milestones",
    body: "That Caribbean wedding. The Lisbon trip. The roadside diner. All pinned.",
  },
  {
    icon: TrendingUp,
    heading: "Grows over time",
    body: "Every new trip, every family addition — your map fills in as you use Family Nest.",
  },
];

export function WorldMapSection() {
  return (
    <section
      className="py-20 md:py-32 overflow-hidden"
      style={{ backgroundColor: "var(--secondary)" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Family Map
          </p>
          <h2
            className="mb-4 text-3xl md:text-4xl lg:text-5xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Your family spans the whole world
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            Pin birthplaces, vacations, wedding spots, and that diner stop everyone
            still talks about. Watch your family&apos;s world story fill in over the years.
          </p>
        </div>

        {/* Map */}
        <div
          className="relative mx-auto overflow-hidden rounded-3xl shadow-2xl"
          style={{
            border: "1px solid var(--border)",
            maxWidth: "900px",
            aspectRatio: "900 / 420",
          }}
        >
          <Suspense
            fallback={
              <div
                className="h-full w-full rounded-3xl"
                style={{ background: "hsl(210,40%,88%)" }}
              />
            }
          >
            <WorldMapSVG pins={MAP_PINS} defaultPinR={5} />
          </Suspense>

          {/* Pin count badge */}
          <div
            className="absolute top-4 right-4 rounded-xl px-3 py-2 shadow-lg"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <p className="text-[10px] font-medium opacity-75">Pinned so far</p>
            <p className="text-sm font-bold">8 locations</p>
          </div>

          {/* Legend */}
          <div
            className="absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-xl px-3 py-2.5 shadow-md"
            style={{
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid var(--border)",
              backdropFilter: "blur(4px)",
            }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              The Smith Family
            </p>
            {[
              { color: "#3d6b5e", label: "7 locations" },
              { color: "#d97706", label: "Caribbean wedding" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[9px]" style={{ color: "var(--foreground)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature callouts */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3 text-center">
          {CALLOUTS.map((item) => (
            <div key={item.heading} className="flex flex-col items-center gap-2">
              <div
                className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--primary-light, rgba(61,107,94,0.1))" }}
              >
                <item.icon size={18} style={{ color: "var(--primary)" }} />
              </div>
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display-serif)", color: "var(--foreground)" }}
              >
                {item.heading}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
