/* ── WorldMapSection ─────────────────────────────────────────────────────────
   Uses the Google Maps Static API to render a real world map with pins.
   The image URL is built server-side from the env key — no client JS needed.
   ─────────────────────────────────────────────────────────────────────────── */

const LOCATIONS = [
  { lat: 43.65, lng: -79.38,  label: "Toronto, Canada" },
  { lat: 37.77, lng: -122.42, label: "San Francisco" },
  { lat: 40.71, lng: -74.01,  label: "New York" },
  { lat: 17.99, lng: -66.61,  label: "Puerto Rico" },  // Caribbean wedding
  { lat: 38.72, lng: -9.14,   label: "Lisbon, Portugal" },
  { lat: 51.51, lng: -0.13,   label: "London" },
  { lat: 19.08, lng: 72.88,   label: "Mumbai, India" },
  { lat: -33.87, lng: 151.21, label: "Sydney, Australia" },
];

const CALLOUTS = [
  {
    heading: "Birthplaces",
    body: "Mark where every family member was born, no matter the continent.",
  },
  {
    heading: "Vacations & milestones",
    body: "That Caribbean wedding. The Lisbon trip. The roadside diner. All pinned.",
  },
  {
    heading: "Grows over time",
    body: "Every new trip, every family addition — your map fills in over generations.",
  },
];

function buildStaticMapUrl(apiKey: string): string {
  const base = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams({
    size: "900x420",
    scale: "2",
    maptype: "roadmap",
    // Subtle, desaturated style so pins pop
    style: "feature:all|element:labels|visibility:simplified",
    key: apiKey,
  });

  // Add all pins as markers
  const pinColor = "0x3d6b5e"; // matches --primary
  const weddingColor = "0xd97706"; // highlight for Caribbean
  LOCATIONS.forEach(({ lat, lng }, i) => {
    const color = i === 3 ? weddingColor : pinColor;
    params.append("markers", `color:${color}|size:mid|${lat},${lng}`);
  });

  // Center & zoom to show the whole world
  params.set("center", "20,10");
  params.set("zoom", "2");

  return `${base}?${params.toString()}`;
}

export function WorldMapSection() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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

        {/* Map image */}
        <div
          className="relative mx-auto overflow-hidden rounded-3xl shadow-2xl"
          style={{
            border: "1px solid var(--border)",
            maxWidth: "900px",
            backgroundColor: "hsl(210,40%,88%)",
            aspectRatio: "900 / 420",
          }}
        >
          {apiKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={buildStaticMapUrl(apiKey)}
              alt="World map showing Thompson family locations across Canada, USA, Caribbean, Portugal, UK, India, and Australia"
              className="h-full w-full object-cover"
              width={900}
              height={420}
            />
          ) : (
            /* Fallback when no API key — clean placeholder */
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: "linear-gradient(160deg, hsl(205,55%,88%) 0%, hsl(210,50%,82%) 100%)",
                minHeight: "320px",
              }}
            >
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Map preview requires a Google Maps API key
              </p>
            </div>
          )}

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
              The Thompson Family
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
            <div key={item.heading} className="flex flex-col gap-2">
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
