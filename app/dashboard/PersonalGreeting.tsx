"use client";

import { useState, useEffect } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function PersonalGreeting({ firstName }: { firstName: string | null }) {
  const [greeting, setGreeting] = useState("Welcome home");

  useEffect(() => {
    const timeGreeting = getGreeting();
    setGreeting(firstName ? `${timeGreeting}, ${firstName}` : timeGreeting);
  }, [firstName]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        {greeting}
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Your family hub. Pick a destination below.
      </p>
    </div>
  );
}
