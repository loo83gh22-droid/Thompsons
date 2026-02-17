import type { Metadata } from "next";
import "./globals.css";
import { MosaicBackground } from "./components/MosaicBackground";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Our Family Nest | Private. Permanent. Yours.",
  description:
    "A private space for families to document their lives together. Journals, photos, videos, voice memos, and more. Not social media. A family heirloom.",
  openGraph: {
    title: "Our Family Nest",
    description:
      "Document your family's life. Share it privately with the people who matter, no matter where they live.",
    url: "https://thompsons.vercel.app",
    siteName: "Our Family Nest",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Our Family Nest | Your Corner of the World",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Family Nest",
    description:
      "Document your family's life. Share it privately with the people who matter.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MosaicBackground />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
