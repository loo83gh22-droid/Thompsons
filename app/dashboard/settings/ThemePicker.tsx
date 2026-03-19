"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserTheme } from "./actions";

export type ThemeId = "warm" | "ocean" | "forest" | "sunset" | "lavender" | "midnight" | "vintage" | "nineties";

const themes: { id: ThemeId; name: string; description: string; colors: [string, string, string] }[] = [
  {
    id: "warm",
    name: "Warm",
    description: "Cozy earth tones",
    colors: ["hsl(40, 25%, 92%)", "hsl(160, 36%, 26%)", "hsl(24, 65%, 48%)"],
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calm coastal blues",
    colors: ["hsl(205, 30%, 92%)", "hsl(200, 50%, 30%)", "hsl(190, 55%, 38%)"],
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep natural greens",
    colors: ["hsl(140, 18%, 91%)", "hsl(155, 40%, 25%)", "hsl(135, 45%, 35%)"],
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm oranges and rose",
    colors: ["hsl(15, 30%, 92%)", "hsl(350, 45%, 35%)", "hsl(15, 70%, 50%)"],
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft purple haze",
    colors: ["hsl(265, 20%, 93%)", "hsl(280, 35%, 35%)", "hsl(275, 45%, 48%)"],
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark mode",
    colors: ["hsl(220, 20%, 14%)", "hsl(210, 50%, 55%)", "hsl(35, 60%, 55%)"],
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Faded sepia warmth",
    colors: ["hsl(38, 30%, 88%)", "hsl(15, 40%, 32%)", "hsl(30, 50%, 42%)"],
  },
  {
    id: "nineties",
    name: "90s",
    description: "Saved by the Bell energy",
    colors: ["hsl(185, 85%, 84%)", "hsl(325, 100%, 50%)", "hsl(135, 100%, 36%)"],
  },
];

export function ThemePicker({ currentTheme }: { currentTheme: ThemeId }) {
  const [selected, setSelected] = useState<ThemeId>(currentTheme);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSelect(themeId: ThemeId) {
    setSelected(themeId);
    // Apply instantly to the DOM for preview
    document.documentElement.setAttribute("data-theme", themeId === "warm" ? "" : themeId);
    if (themeId === "warm") document.documentElement.removeAttribute("data-theme");

    // Persist to DB
    startTransition(async () => {
      await setUserTheme(themeId);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {themes.map((theme) => {
        const isActive = selected === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => handleSelect(theme.id)}
            disabled={isPending}
            className={`group relative flex flex-col items-start overflow-hidden rounded-xl border-2 p-3.5 text-left transition-all duration-200 ${
              isActive
                ? "border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/20"
                : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-sm"
            }`}
          >
            {/* Color swatch bar */}
            <div className="mb-3 flex w-full gap-1.5">
              {theme.colors.map((color, i) => (
                <div
                  key={i}
                  className="h-6 flex-1 rounded-md shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{theme.name}</p>
            <p className="text-xs text-[var(--muted)]">{theme.description}</p>
            {isActive && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-xs text-[var(--accent-foreground)]">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
