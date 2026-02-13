"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/client";
import { setActiveFamily } from "./actions/family";
import { SkipLink } from "./components/SkipLink";
import { GlobalSearch } from "./GlobalSearch";

type Family = { id: string; name: string };

const navItemsBeforeDropdowns: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Home" },
];

const familyItems: { href: string; label: string; muted?: boolean }[] = [
  { href: "/dashboard/our-family", label: "Our Family" },
  { href: "/dashboard/map", label: "Family Map" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/death-box", label: "Da Box", muted: true },
];

const memoriesItems: { href: string; label: string }[] = [
  { href: "/dashboard/timeline", label: "Timeline" },
  { href: "/dashboard/journal", label: "Journal" },
  { href: "/dashboard/photos", label: "Photos" },
  { href: "/dashboard/stories", label: "Stories" },
  { href: "/dashboard/recipes", label: "Recipes" },
  { href: "/dashboard/voice-memos", label: "Voice Memos" },
  { href: "/dashboard/time-capsules", label: "Time Capsules" },
  { href: "/dashboard/traditions", label: "Traditions" },
];

const favouritesItems: { href: string; label: string }[] = [
  { href: "/dashboard/favourites", label: "Favourites" },
  { href: "/dashboard/favourites/books", label: "Books" },
  { href: "/dashboard/favourites/movies", label: "Movies" },
  { href: "/dashboard/favourites/shows", label: "Shows" },
  { href: "/dashboard/favourites/music", label: "Music" },
  { href: "/dashboard/favourites/podcasts", label: "Podcasts" },
  { href: "/dashboard/favourites/games", label: "Games" },
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
  const [familyOpen, setFamilyOpen] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [favouritesOpen, setFavouritesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [familyMenuOpen, setFamilyMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFamilyOpen, setMobileFamilyOpen] = useState(false);
  const [mobileMemoriesOpen, setMobileMemoriesOpen] = useState(false);
  const [mobileFavouritesOpen, setMobileFavouritesOpen] = useState(false);
  const familyRef = useRef<HTMLDivElement>(null);
  const memoriesRef = useRef<HTMLDivElement>(null);
  const favouritesRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const familySwitcherRef = useRef<HTMLDivElement>(null);

  async function handleSwitchFamily(familyId: string) {
    await setActiveFamily(familyId);
    setFamilyMenuOpen(false);
    setMobileMenuOpen(false);
    router.refresh();
  }

  const isFamilyActive = familyItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const isMemoriesActive = memoriesItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const isFavouritesActive = favouritesItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (familyRef.current && !familyRef.current.contains(target)) setFamilyOpen(false);
      if (memoriesRef.current && !memoriesRef.current.contains(target)) setMemoriesOpen(false);
      if (favouritesRef.current && !favouritesRef.current.contains(target)) setFavouritesOpen(false);
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (familySwitcherRef.current && !familySwitcherRef.current.contains(target)) setFamilyMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileMenu();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setFamilyOpen(false);
    setMemoriesOpen(false);
    setFavouritesOpen(false);
    setMobileFamilyOpen(false);
    setMobileMemoriesOpen(false);
    setMobileFavouritesOpen(false);
  }

  const navLinkClass = (isActive: boolean) =>
    `block rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
      isActive ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    }`;

  const dropdownButtonClass = (isOpen: boolean, isActive: boolean) =>
    `flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
      isOpen || isActive
        ? "bg-[var(--surface)] text-[var(--accent)] border border-[var(--accent)]/40"
        : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    }`;

  return (
    <>
      <SkipLink />
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo / family name - always visible, left */}
          <div className="relative flex min-h-[44px] min-w-0 flex-1 items-center gap-2 md:flex-initial" ref={familySwitcherRef}>
            <Link
              href="/dashboard"
              className="font-display text-xl font-semibold transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:text-2xl min-[768px]:text-3xl truncate"
              aria-label={`${familyName} Nest - Go to home`}
            >
              {familyName} Nest
            </Link>
            {families.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setFamilyMenuOpen((o) => !o)}
                  className="touch-target hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] min-[768px]:flex"
                  aria-label="Switch family"
                  aria-expanded={familyMenuOpen}
                >
                  <span className={`block transition-transform ${familyMenuOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {familyMenuOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg" role="menu">
                    {families.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleSwitchFamily(f.id)}
                        className={`block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface-hover)] focus:bg-[var(--surface-hover)] ${
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

          {/* Search */}
          <div className="hidden min-[768px]:block">
            <GlobalSearch />
          </div>

          {/* Desktop nav - hidden below 768px, only logo + hamburger show on mobile */}
          <nav className="hidden min-[768px]:flex items-center gap-1" aria-label="Main navigation">
            {navItemsBeforeDropdowns.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(pathname === item.href)}>
                {item.label}
              </Link>
            ))}
            <div className="relative" ref={familyRef}>
              <button
                type="button"
                onClick={() => setFamilyOpen((o) => !o)}
                className={dropdownButtonClass(familyOpen, isFamilyActive)}
                aria-haspopup="true"
                aria-expanded={familyOpen}
                aria-label={familyOpen ? "Close Family menu" : "Open Family menu"}
              >
                Family
                <span className={`transition-transform ${familyOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {familyOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
                  role="menu"
                >
                  {familyItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setFamilyOpen(false)}
                      role="menuitem"
                      className={`block px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)] focus:bg-[var(--surface-hover)] ${
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "text-[var(--accent)]"
                          : item.muted
                            ? "text-[var(--muted)]"
                            : "text-[var(--foreground)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={memoriesRef}>
              <button
                type="button"
                onClick={() => setMemoriesOpen((o) => !o)}
                className={dropdownButtonClass(memoriesOpen, isMemoriesActive)}
                aria-haspopup="true"
                aria-expanded={memoriesOpen}
                aria-label={memoriesOpen ? "Close Memories menu" : "Open Memories menu"}
              >
                Memories
                <span className={`transition-transform ${memoriesOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {memoriesOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
                  role="menu"
                >
                  {memoriesItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMemoriesOpen(false)}
                      role="menuitem"
                      className={`block px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)] focus:bg-[var(--surface-hover)] ${
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
                className={dropdownButtonClass(favouritesOpen, isFavouritesActive)}
                aria-haspopup="true"
                aria-expanded={favouritesOpen}
                aria-label={favouritesOpen ? "Close Favourites menu" : "Open Favourites menu"}
              >
                Favourites
                <span className={`transition-transform ${favouritesOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {favouritesOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
                  role="menu"
                >
                  {favouritesItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setFavouritesOpen(false)}
                      role="menuitem"
                      className={`block px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)] focus:bg-[var(--surface-hover)] ${
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
          </nav>

          {/* Right side: Hamburger (mobile only, opens drawer) + Account menu (desktop only) */}
          <div className="flex min-h-[44px] shrink-0 items-center gap-1" ref={menuRef}>
            {/* Hamburger - mobile only: opens navigation drawer */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="touch-target flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] min-[768px]:hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <span className={`block h-0.5 w-5 bg-current transition-transform ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition-transform ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
            {/* Account menu - desktop only (768px+) */}
            <div className="relative hidden min-[768px]:block">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="touch-target flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label={menuOpen ? "Close account menu" : "Account menu"}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg" role="menu">
                  <div className="border-b border-[var(--border)] px-4 py-2">
                    <span className="text-sm text-[var(--muted)]">{user.email}</span>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <Link
                    href="/dashboard/settings/nest-keepers"
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Nest Keepers
                  </Link>
                  <Link
                    href="/pricing"
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <a
                    href={`mailto:${typeof process.env.NEXT_PUBLIC_FEEDBACK_EMAIL === "string" ? process.env.NEXT_PUBLIC_FEEDBACK_EMAIL : "feedback@example.com"}?subject=Family%20Nest%20Feedback`}
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Send feedback
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="block w-full px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay - click outside to close drawer (only below 768px) */}
      <div
        className={`fixed inset-0 z-[45] bg-black/50 transition-opacity duration-300 min-[768px]:hidden ${mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!mobileMenuOpen}
        onClick={closeMobileMenu}
      />
      {/* Mobile drawer - slides in from right (only below 768px) */}
      <aside
        id="mobile-nav-drawer"
        className={`fixed right-0 top-0 z-50 h-full w-[min(320px,85vw)] transform border-l border-[var(--border)] bg-[var(--background)] shadow-xl transition-transform duration-300 ease-out min-[768px]:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          <div className="flex min-h-[44px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="min-w-0 truncate text-sm text-[var(--muted)]" title={user.email ?? undefined}>
              {user.email}
            </p>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label="Close menu"
            >
              <span className="text-xl leading-none" aria-hidden="true">×</span>
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto py-4 pl-4 pr-2">
            {/* Mobile search */}
            <div className="mb-3">
              <GlobalSearch />
            </div>
            {navItemsBeforeDropdowns.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={navLinkClass(pathname === item.href)}>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-[var(--border)] pt-2 mt-2">
              <button
                type="button"
                onClick={() => setMobileFamilyOpen((o) => !o)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${mobileFamilyOpen || isFamilyActive ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}
                aria-expanded={mobileFamilyOpen}
              >
                Family
                <span className={`block transition-transform ${mobileFamilyOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {mobileFamilyOpen && (
                <div className="pl-2 pt-1 space-y-0.5">
                  {familyItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`block rounded-lg px-4 py-2.5 text-sm min-h-[44px] flex items-center ${pathname === item.href || pathname.startsWith(item.href + "/") ? "text-[var(--accent)]" : item.muted ? "text-[var(--muted)]" : "text-[var(--foreground)]"} hover:bg-[var(--surface)] hover:text-[var(--foreground)]`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-[var(--border)] pt-2 mt-2">
              <button
                type="button"
                onClick={() => setMobileMemoriesOpen((o) => !o)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${mobileMemoriesOpen || isMemoriesActive ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}
                aria-expanded={mobileMemoriesOpen}
              >
                Memories
                <span className={`block transition-transform ${mobileMemoriesOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {mobileMemoriesOpen && (
                <div className="pl-2 pt-1 space-y-0.5">
                  {memoriesItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`block rounded-lg px-4 py-2.5 text-sm min-h-[44px] flex items-center ${pathname === item.href || pathname.startsWith(item.href + "/") ? "text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-[var(--border)] pt-2 mt-2">
              <button
                type="button"
                onClick={() => setMobileFavouritesOpen((o) => !o)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${mobileFavouritesOpen || isFavouritesActive ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}
                aria-expanded={mobileFavouritesOpen}
              >
                Favourites
                <span className={`block transition-transform ${mobileFavouritesOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {mobileFavouritesOpen && (
                <div className="pl-2 pt-1 space-y-0.5">
                  {favouritesItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`block rounded-lg px-4 py-2.5 text-sm min-h-[44px] flex items-center ${pathname === item.href || pathname.startsWith(item.href + "/") ? "text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-auto border-t border-[var(--border)] pt-4 space-y-1">
              <Link
                href="/dashboard/settings"
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Account Settings
              </Link>
              <Link
                href="/dashboard/settings/nest-keepers"
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Nest Keepers
              </Link>
              <Link
                href="/pricing"
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
              <a
                href={`mailto:${typeof process.env.NEXT_PUBLIC_FEEDBACK_EMAIL === "string" ? process.env.NEXT_PUBLIC_FEEDBACK_EMAIL : "feedback@example.com"}?subject=Family%20Nest%20Feedback`}
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Send feedback
              </a>
              <button
                type="button"
                onClick={() => { closeMobileMenu(); handleSignOut(); }}
                className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] min-h-[44px]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
