"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/client";
import { setActiveFamily } from "./actions/family";
import { SkipLink } from "./components/SkipLink";
import { LogoMark } from "@/app/components/LogoMark";
import { GlobalSearch } from "./GlobalSearch";

type Family = { id: string; name: string };

const navItemsBeforeDropdowns: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Home" },
];

// Core family items — always shown in the Family dropdown
const coreFamilyItems: { href: string; label: string }[] = [
  { href: "/dashboard/our-family", label: "Our Family" },
  { href: "/dashboard/pets", label: "Pets" },
  { href: "/dashboard/map", label: "Family Map" },
  { href: "/dashboard/events", label: "Annual Events" },
];

// Core memories items — always shown in the Memories dropdown
const coreMemoriesItems: { href: string; label: string }[] = [
  { href: "/dashboard/timeline", label: "Timeline" },
  { href: "/dashboard/journal", label: "Journal" },
  { href: "/dashboard/letters", label: "Letters" },
];

type AddOn = { name: string; href: string };

export function Nav({
  user,
  familyName = "Our Family",
  families = [],
  activeFamilyId = null,
  enabledMemoryAddOns = [],
  enabledFamilyAddOns = [],
  enabledActivitiesAddOns = [],
  enabledExtrasAddOns = [],
}: {
  user: User;
  familyName?: string;
  families?: Family[];
  activeFamilyId?: string | null;
  enabledMemoryAddOns?: AddOn[];
  enabledFamilyAddOns?: AddOn[];
  enabledActivitiesAddOns?: AddOn[];
  enabledExtrasAddOns?: AddOn[];
}) {
  // Build memories dropdown from core + enabled memory add-ons
  const memoriesItems: { href: string; label: string }[] = [
    ...coreMemoriesItems,
    ...enabledMemoryAddOns.map((a) => ({ href: a.href, label: a.name })),
  ];

  // Build family dropdown from core + enabled family add-ons
  const familyItems: { href: string; label: string }[] = [
    ...coreFamilyItems,
    ...enabledFamilyAddOns.map((a) => ({ href: a.href, label: a.name })),
  ];

  // Activities: games, goals, travel add-ons — only shown when at least one is enabled
  const activitiesItems: { href: string; label: string }[] = [
    ...enabledActivitiesAddOns.map((a) => ({ href: a.href, label: a.name })),
  ];

  // Extras: planning + essentials add-ons — Feature Catalog always included
  const extrasItems: { href: string; label: string }[] = [
    ...enabledExtrasAddOns.map((a) => ({ href: a.href, label: a.name })),
    { href: "/dashboard/tools", label: "Feature Catalog" },
  ];
  const pathname = usePathname();
  const router = useRouter();
  const [familyOpen, setFamilyOpen] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [familyMenuOpen, setFamilyMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFamilyOpen, setMobileFamilyOpen] = useState(false);
  const [mobileMemoriesOpen, setMobileMemoriesOpen] = useState(false);
  const [mobileActivitiesOpen, setMobileActivitiesOpen] = useState(false);
  const [mobileExtrasOpen, setMobileExtrasOpen] = useState(false);
  const familyRef = useRef<HTMLDivElement>(null);
  const memoriesRef = useRef<HTMLDivElement>(null);
  const activitiesRef = useRef<HTMLDivElement>(null);
  const extrasRef = useRef<HTMLDivElement>(null);
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
  const isActivitiesActive = activitiesItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const isExtrasActive = extrasItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (familyRef.current && !familyRef.current.contains(target)) setFamilyOpen(false);
      if (memoriesRef.current && !memoriesRef.current.contains(target)) setMemoriesOpen(false);
      if (activitiesRef.current && !activitiesRef.current.contains(target)) setActivitiesOpen(false);
      if (extrasRef.current && !extrasRef.current.contains(target)) setExtrasOpen(false);
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

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setFamilyOpen(false);
    setMemoriesOpen(false);
    setActivitiesOpen(false);
    setExtrasOpen(false);
    setMobileFamilyOpen(false);
    setMobileMemoriesOpen(false);
    setMobileActivitiesOpen(false);
    setMobileExtrasOpen(false);
  }

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileMenu();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Allow MobileBottomNav "More" tab to open this drawer
  useEffect(() => {
    function handleOpenNav() { setMobileMenuOpen(true); }
    window.addEventListener("open-mobile-nav", handleOpenNav);
    return () => window.removeEventListener("open-mobile-nav", handleOpenNav);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
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
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur shadow-[0_1px_12px_rgba(0,0,0,0.07)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo / family name - always visible, left */}
          <div className="relative flex min-h-[44px] min-w-0 flex-1 items-center gap-2 md:flex-initial" ref={familySwitcherRef}>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-display text-xl font-semibold transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:text-2xl min-[768px]:text-3xl truncate"
              aria-label={`${familyName} Nest - Go to home`}
            >
              <LogoMark size={28} className="shrink-0" />
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
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]" role="menu">
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
                  className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]"
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
                  className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]"
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
            {activitiesItems.length > 0 && (
              <div className="relative" ref={activitiesRef}>
                <button
                  type="button"
                  onClick={() => setActivitiesOpen((o) => !o)}
                  className={dropdownButtonClass(activitiesOpen, isActivitiesActive)}
                  aria-haspopup="true"
                  aria-expanded={activitiesOpen}
                  aria-label={activitiesOpen ? "Close Activities menu" : "Open Activities menu"}
                >
                  Activities
                  <span className={`transition-transform ${activitiesOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {activitiesOpen && (
                  <div
                    className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]"
                    role="menu"
                  >
                    {activitiesItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActivitiesOpen(false)}
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
            )}
            <div className="relative" ref={extrasRef}>
              <button
                type="button"
                onClick={() => setExtrasOpen((o) => !o)}
                className={dropdownButtonClass(extrasOpen, isExtrasActive)}
                aria-haspopup="true"
                aria-expanded={extrasOpen}
                aria-label={extrasOpen ? "Close Extras menu" : "Open Extras menu"}
              >
                Extras
                <span className={`transition-transform ${extrasOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {extrasOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]"
                  role="menu"
                >
                  {extrasItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setExtrasOpen(false)}
                      role="menuitem"
                      className={`block px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)] focus:bg-[var(--surface-hover)] ${
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "text-[var(--accent)]"
                          : item.label === "Feature Catalog"
                            ? "text-[var(--muted)] font-medium"
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
            {/* Hamburger - hidden on mobile (MobileBottomNav "More" tab opens the drawer instead) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="touch-target hidden min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]" role="menu">
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
                    href="/dashboard/contacts"
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Family Contacts
                  </Link>
                  <Link
                    href="/dashboard/contacts/digest"
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Send a Family Update
                  </Link>
                  <Link
                    href="/pricing"
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/dashboard/feedback"
                    role="menuitem"
                    className="block px-4 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:bg-[var(--surface-hover)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Send feedback
                  </Link>
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
            {/* Mobile family switcher */}
            {families.length > 1 && (
              <div className="mb-3 space-y-1">
                <p className="px-4 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Switch Nest</p>
                {families.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSwitchFamily(f.id)}
                    className={`block w-full rounded-lg px-4 py-2.5 text-left text-sm min-h-[44px] transition-colors ${
                      f.id === activeFamilyId
                        ? "bg-[var(--surface)] text-[var(--accent)] font-medium"
                        : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    {f.name} Nest
                  </button>
                ))}
              </div>
            )}
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
                    <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`block rounded-lg px-4 py-2.5 text-sm min-h-[44px] flex items-center ${pathname === item.href || pathname.startsWith(item.href + "/") ? "text-[var(--accent)]" : "text-[var(--foreground)]"} hover:bg-[var(--surface)] hover:text-[var(--foreground)]`}>
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
            {activitiesItems.length > 0 && (
              <div className="border-t border-[var(--border)] pt-2 mt-2">
                <button
                  type="button"
                  onClick={() => setMobileActivitiesOpen((o) => !o)}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${mobileActivitiesOpen || isActivitiesActive ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}
                  aria-expanded={mobileActivitiesOpen}
                >
                  Activities
                  <span className={`block transition-transform ${mobileActivitiesOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {mobileActivitiesOpen && (
                  <div className="pl-2 pt-1 space-y-0.5">
                    {activitiesItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`block rounded-lg px-4 py-2.5 text-sm min-h-[44px] flex items-center ${pathname === item.href || pathname.startsWith(item.href + "/") ? "text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="border-t border-[var(--border)] pt-2 mt-2">
              <button
                type="button"
                onClick={() => setMobileExtrasOpen((o) => !o)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${mobileExtrasOpen || isExtrasActive ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}
                aria-expanded={mobileExtrasOpen}
              >
                Extras
                <span className={`block transition-transform ${mobileExtrasOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {mobileExtrasOpen && (
                <div className="pl-2 pt-1 space-y-0.5">
                  {extrasItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`block rounded-lg px-4 py-2.5 text-sm min-h-[44px] flex items-center ${pathname === item.href || pathname.startsWith(item.href + "/") ? "text-[var(--accent)]" : item.label === "Feature Catalog" ? "text-[var(--muted)] font-medium" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
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
                href="/dashboard/contacts"
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Family Contacts
              </Link>
              <Link
                href="/dashboard/contacts/digest"
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Send a Family Update
              </Link>
              <Link
                href="/pricing"
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
              <Link
                href="/dashboard/feedback"
                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] min-h-[44px] flex items-center"
                onClick={closeMobileMenu}
              >
                Send feedback
              </Link>
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
