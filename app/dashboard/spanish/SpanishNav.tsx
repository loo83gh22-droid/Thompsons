"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, BookOpen, ClipboardCheck, MessageCircle } from "lucide-react";

const navItems = [
  { href: "/dashboard/spanish", label: "Dashboard", icon: Flame, exact: true },
  { href: "/dashboard/spanish/flashcards", label: "Flashcards", icon: BookOpen, exact: false },
  { href: "/dashboard/spanish/quiz", label: "Grammar Quiz", icon: ClipboardCheck, exact: false },
  { href: "/dashboard/spanish/tutor", label: "AI Tutor", icon: MessageCircle, exact: false },
];

export function SpanishNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
