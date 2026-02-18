"use client";

/* ── WorldMapSection ─────────────────────────────────────────────────────────
   Full-width world map section for the marketing homepage.
   Uses a simplified SVG world map with animated family pins.
   No external map dependencies — pure SVG + CSS animations.
   ─────────────────────────────────────────────────────────────────────────── */

const PINS = [
  { cx: 178, cy: 118, label: "Toronto, Canada", emoji: "🍁" },
  { cx: 148, cy: 148, label: "San Francisco, US", emoji: "🌉" },
  { cx: 185, cy: 152, label: "New York, US", emoji: "🗽" },
  { cx: 219, cy: 183, label: "Caribbean", emoji: "🌊", highlight: true },
  { cx: 261, cy: 133, label: "Lisbon, Portugal", emoji: "🇵🇹" },
  { cx: 342, cy: 188, label: "Mumbai, India", emoji: "🕌" },
  { cx: 415, cy: 220, label: "Sydney, Australia", emoji: "🦘" },
  { cx: 395, cy: 110, label: "Tokyo, Japan", emoji: "🌸" },
  { cx: 295, cy: 105, label: "London, UK", emoji: "🎡" },
];

/* Simplified world continent paths (equirectangular projection, 500×280 viewBox) */
const CONTINENTS = `
  M 130,85 L 148,78 L 165,80 L 175,90 L 185,88 L 195,95 L 200,108
  L 195,120 L 185,130 L 178,138 L 170,145 L 160,148 L 148,145
  L 140,138 L 132,128 L 128,118 L 125,105 Z

  M 205,105 L 215,100 L 225,102 L 232,110 L 230,120 L 222,125
  L 215,128 L 208,122 L 205,113 Z

  M 238,98 L 252,95 L 268,98 L 278,106 L 282,118 L 278,130
  L 268,138 L 258,142 L 248,140 L 238,133 L 234,122 L 234,110 Z

  M 285,100 L 298,96 L 312,98 L 322,105 L 325,118 L 320,130
  L 310,140 L 300,145 L 290,142 L 282,135 L 280,122 L 280,110 Z

  M 285,145 L 295,142 L 308,148 L 315,158 L 312,170 L 305,178
  L 295,182 L 285,178 L 278,168 L 278,158 Z

  M 325,105 L 340,100 L 360,102 L 378,108 L 390,118 L 395,130
  L 398,145 L 392,158 L 380,165 L 365,168 L 350,165 L 338,155
  L 328,142 L 322,128 L 322,115 Z

  M 398,115 L 412,110 L 428,112 L 440,120 L 445,132 L 440,145
  L 430,152 L 418,155 L 405,150 L 398,140 L 395,128 Z

  M 385,168 L 400,162 L 418,165 L 432,175 L 438,188 L 435,202
  L 425,212 L 410,218 L 395,215 L 382,205 L 378,192 L 378,180 Z
`;

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

        {/* Map container */}
        <div
          className="relative mx-auto overflow-hidden rounded-3xl shadow-2xl"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "hsl(210,40%,96%)",
            maxWidth: "900px",
          }}
        >
          {/* Ocean background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(160deg, hsl(205,55%,88%) 0%, hsl(210,50%,82%) 100%)",
            }}
          />

          {/* SVG World Map */}
          <svg
            viewBox="0 0 500 280"
            className="relative w-full"
            style={{ display: "block" }}
            aria-label="World map with family pins"
          >
            {/* Grid lines (latitude/longitude) */}
            {[60, 120, 180, 240, 300, 360, 420].map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={280} stroke="hsl(210,40%,78%)" strokeWidth="0.5" strokeDasharray="3,4" />
            ))}
            {[70, 140, 210].map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={500} y2={y} stroke="hsl(210,40%,78%)" strokeWidth="0.5" strokeDasharray="3,4" />
            ))}

            {/* Continent shapes */}
            <path
              d={CONTINENTS}
              fill="hsl(130,18%,72%)"
              stroke="hsl(130,15%,62%)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />

            {/* Pins */}
            {PINS.map((pin, i) => (
              <g key={pin.label} style={{ animationDelay: `${i * 0.15}s` }}>
                {/* Pulse ring */}
                <circle
                  cx={pin.cx}
                  cy={pin.cy}
                  r="8"
                  fill="none"
                  stroke={pin.highlight ? "hsl(25,85%,55%)" : "hsl(155,45%,45%)"}
                  strokeWidth="1.5"
                  opacity="0.45"
                  style={{
                    animation: `mapPulse 2.4s ease-out ${i * 0.3}s infinite`,
                    transformOrigin: `${pin.cx}px ${pin.cy}px`,
                  }}
                />
                {/* Pin dot */}
                <circle
                  cx={pin.cx}
                  cy={pin.cy}
                  r="5"
                  fill={pin.highlight ? "hsl(25,85%,55%)" : "hsl(155,40%,38%)"}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                {/* Emoji label */}
                <text
                  x={pin.cx}
                  y={pin.cy - 10}
                  textAnchor="middle"
                  fontSize="8"
                  style={{ userSelect: "none" }}
                >
                  {pin.emoji}
                </text>
              </g>
            ))}

            {/* Connector lines between pins (family routes) */}
            {[
              [PINS[0], PINS[2]],  // Toronto → New York
              [PINS[2], PINS[3]],  // New York → Caribbean
              [PINS[3], PINS[4]],  // Caribbean → Portugal
              [PINS[4], PINS[8]],  // Portugal → London
              [PINS[8], PINS[5]],  // London → Mumbai
              [PINS[5], PINS[6]],  // Mumbai → Sydney
            ].map(([a, b], i) => (
              <line
                key={i}
                x1={a.cx} y1={a.cy}
                x2={b.cx} y2={b.cy}
                stroke="hsl(155,35%,50%)"
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity="0.35"
              />
            ))}
          </svg>

          {/* Legend overlay */}
          <div
            className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-xl px-3 py-2.5"
            style={{
              backgroundColor: "rgba(255,255,255,0.88)",
              border: "1px solid var(--border)",
              backdropFilter: "blur(4px)",
            }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              The Thompson Family
            </p>
            {[
              { color: "hsl(155,40%,38%)", label: "9 family pins" },
              { color: "hsl(25,85%,55%)", label: "Married in the Caribbean" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[9px]" style={{ color: "var(--foreground)" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Pin count badge */}
          <div
            className="absolute top-3 right-3 rounded-xl px-3 py-2"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <p className="text-[10px] font-medium opacity-75">Pinned so far</p>
            <p className="text-sm font-bold">9 locations</p>
          </div>
        </div>

        {/* Feature callouts */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3 text-center">
          {[
            { heading: "Birthplaces", body: "Mark where every family member was born, no matter the continent." },
            { heading: "Vacations & milestones", body: "That Caribbean wedding. The Lisbon trip. The roadside diner. All pinned." },
            { heading: "Grows over time", body: "Every new trip, every family addition — your map fills in over generations." },
          ].map((item) => (
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

      {/* Keyframe animation */}
      <style>{`
        @keyframes mapPulse {
          0%   { r: 5; opacity: 0.5; }
          60%  { r: 12; opacity: 0; }
          100% { r: 12; opacity: 0; }
        }
      `}</style>
    </section>
  );
}
