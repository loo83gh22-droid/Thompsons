"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QuickCreateSheet } from "./QuickCreateSheet";

type Tab = {
  href?: string;
  label: string;
  icon: React.ReactNode;
  action?: "create" | "more";
};

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16v16H4z" rx="2" />
      <path d="M4 9h16M4 14h16M9 4v16" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function MobileBottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  function openMobileNav() {
    // Signal the Nav drawer to open
    window.dispatchEvent(new CustomEvent("open-mobile-nav"));
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const tabClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[52px] py-1 transition-colors ${
      active
        ? "text-[var(--accent)]"
        : "text-[var(--muted)] hover:text-[var(--foreground)] active:text-[var(--foreground)]"
    }`;

  return (
    <>
      <QuickCreateSheet open={sheetOpen} onClose={closeSheet} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur min-[768px]:hidden"
        aria-label="Mobile navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-end">
          {/* Home */}
          <Link href="/dashboard" className={tabClass(isActive("/dashboard"))}>
            <HomeIcon />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Journal */}
          <Link href="/dashboard/journal" className={tabClass(isActive("/dashboard/journal"))}>
            <JournalIcon />
            <span className="text-[10px] font-medium">Journal</span>
          </Link>

          {/* Center FAB */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Quick create"
              className="relative -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40 transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <span className="text-[10px] font-medium text-[var(--muted)] -mt-1">Add</span>
          </div>

          {/* Photos */}
          <Link href="/dashboard/photos" className={tabClass(isActive("/dashboard/photos"))}>
            <PhotoIcon />
            <span className="text-[10px] font-medium">Photos</span>
          </Link>

          {/* More */}
          <button
            type="button"
            onClick={openMobileNav}
            className={tabClass(false)}
            aria-label="More navigation options"
          >
            <MenuIcon />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
