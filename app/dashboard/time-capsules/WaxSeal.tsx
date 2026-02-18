"use client";

/**
 * WaxSeal — renders a decorative wax seal SVG with the writer's initials.
 * Used on sealed time capsule cards to evoke old-fashioned letter sealing.
 */
export function WaxSeal({
  initials,
  size = 56,
  className = "",
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  // Clamp to 2 chars max
  const label = initials.trim().slice(0, 2).toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Drop shadow filter */}
      <defs>
        <filter id="seal-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#7f1d1d" floodOpacity="0.35" />
        </filter>
        {/* Radial highlight for wax gloss */}
        <radialGradient id="wax-gloss" cx="38%" cy="32%" r="55%">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer jagged "drip" ring — mimics wax spreading */}
      <circle cx="28" cy="28" r="27" fill="#b91c1c" filter="url(#seal-shadow)" />

      {/* Irregular drip blobs around edge */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const r = 25 + (i % 3 === 0 ? 3.5 : i % 2 === 0 ? 2 : 1.5);
        const cx = 28 + r * Math.cos(rad);
        const cy = 28 + r * Math.sin(rad);
        return (
          <circle
            key={angle}
            cx={cx}
            cy={cy}
            r={3 + (i % 2) * 1.5}
            fill="#b91c1c"
          />
        );
      })}

      {/* Main wax disc */}
      <circle cx="28" cy="28" r="22" fill="#dc2626" />

      {/* Glossy highlight to give 3D wax effect */}
      <circle cx="28" cy="28" r="22" fill="url(#wax-gloss)" />

      {/* Thin engraved ring */}
      <circle
        cx="28"
        cy="28"
        r="17"
        fill="none"
        stroke="#991b1b"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />

      {/* Initials */}
      <text
        x="28"
        y="33"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize={label.length === 1 ? "16" : "13"}
        fill="#fff"
        style={{ letterSpacing: "0.05em", userSelect: "none" }}
      >
        {label}
      </text>
    </svg>
  );
}

/** Extract up to 2 initials from a full name */
export function nameToInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
