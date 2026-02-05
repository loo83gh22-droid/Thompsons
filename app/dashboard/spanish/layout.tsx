import Link from "next/link";
import { Flame, BookOpen, ClipboardCheck, MessageCircle } from "lucide-react";
import { SpanishNav } from "./SpanishNav";

export default function SpanishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <SpanishNav />
      {children}
    </div>
  );
}
