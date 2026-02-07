"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/client";
import { setActiveFamily } from "./actions/family";

type Family = { id: string; name: string };

const navItemsBeforeDropdowns: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Home" },
];

const memoriesItems: { href: string; label: string }[] = [
  { href: "/dashboard/map", label: "Family Map" },
  { href: "/dashboard/journal", label: "Journal" },
  { href: "/dashboard/photos", label: "Photos" },
  { href: "/dashboard/achievements", label: "Achievements" },
  { href: "/dashboard/voice-memos", label: "Voice Memos" },
  { href: "/dashboard/time-capsules", label: "Time Capsules" },
  { href: "/dashboard/family-tree", label: "Family Tree" },
];

const favouritesItems: { href: string; label: string }[] = [
  { href: "/dashboard/favourites", label: "Favourites" },
  { href: "/dashboard/favourites/books", label: "Books" },
  { href: "/dashboard/favourites/movies", label: "Movies" },
  { href: "/dashboard/favourites/shows", label: "Shows" },
  { href: "/dashboard/favourites/music", label: "Music" },
  { href: "/dashboard/favourites/podcasts", label: "Podcasts" },
  { href: "/dashboard/favourites/games", label: "Games" },
  { href: "/dashboard/favourites/recipes", label: "Recipes" },
];

const navItemsBetweenDropdowns: { href: string; label: string }[] = [
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/members", label: "Members" },
];

const navItemsAfterDropdowns: { href: string; label: string; muted?: boolean }[] = [
  { href: "/dashboard/death-box", label: "Da Box", muted: true },
];

export function Nav({
  user,
  familyName = "Our Family",
  families = [],
  activeFamilyId = null,
}: {
  user: User;
  familyName?: string;
  families?: Family[];
  activeFamilyId?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [favouritesOpen, setFavouritesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [familyMenuOpen, setFamilyMenuOpen] = useState(false);
  const memoriesRef = useRef<HTMLDivElement>(null);
  const favouritesRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const familyRef = useRef<HTMLDivElement>(null);

  async function handleSwitchFamily(familyId: string) {
    await setActiveFamily(familyId);
    setFamilyMenuOpen(false);
    router.refresh();
  }

  const isMemoriesActive = memoriesItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const isFavouritesActive = favouritesItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (memoriesRef.current && !memoriesRef.current.contains(target)) setMemoriesOpen(false);
      if (favouritesRef.current && !favouritesRef.current.contains(target)) setFavouritesOpen(false);
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (familyRef.current && !familyRef.current.contains(target)) setFamilyMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="relative flex items-center gap-2" ref={familyRef}>
          <Link
            href="/dashboard"
            className="font-display text-2xl font-semibold transition-transform hover:scale-105 sm:text-3xl"
          >
            {familyName} Nest
          </Link>
          {families.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setFamilyMenuOpen((o) => !o)}
                className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                aria-label="Switch family"
              >
                <span className={`block transition-transform ${familyMenuOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {familyMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                  {families.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSwitchFamily(f.id)}
                      className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-hover)] ${
                        f.id === activeFamilyId ? "text-[var(--accent)] font-medium" : "text-[var(--foreground)]"
                      }`}
                    >
                      {f.name} Nest
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <nav className="flex items-center gap-1">
          {navItemsBeforeDropdowns.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-[var(--surface)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="relative" ref={memoriesRef}>
            <button
              type="button"
              onClick={() => setMemoriesOpen((o) => !o)}
              className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isMemoriesActive
                  ? "bg-[var(--surface)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              Memories
              <span className={`transition-transform ${memoriesOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {memoriesOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                {memoriesItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMemoriesOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-hover)] ${
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "text-[var(--accent)]"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={favouritesRef}>
            <button
              type="button"
              onClick={() => setFavouritesOpen((o) => !o)}
              className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isFavouritesActive
                  ? "bg-[var(--surface)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              Favourites
              <span className={`transition-transform ${favouritesOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {favouritesOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                {favouritesItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setFavouritesOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-hover)] ${
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "text-[var(--accent)]"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {navItemsBetweenDropdowns.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-[var(--surface)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {navItemsAfterDropdowns.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-[var(--surface)] text-[var(--accent)]"
                  : item.muted
                    ? "text-[var(--muted)]/70 hover:text-[var(--muted)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex flex-col gap-1 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            aria-label="Account menu"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg">
              <div className="border-b border-[var(--border)] px-4 py-2">
                <span className="text-sm text-[var(--muted)]">{user.email}</span>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full px-4 py-2 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
