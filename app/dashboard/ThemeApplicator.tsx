"use client";

import { useEffect } from "react";

/**
 * Applies the family's theme to the root HTML element.
 * Runs on mount and whenever the theme prop changes.
 */
export function ThemeApplicator({ theme }: { theme: string | null }) {
  useEffect(() => {
    const el = document.documentElement;
    if (theme && theme !== "warm") {
      el.setAttribute("data-theme", theme);
    } else {
      el.removeAttribute("data-theme");
    }
    return () => {
      el.removeAttribute("data-theme");
    };
  }, [theme]);

  return null;
}
