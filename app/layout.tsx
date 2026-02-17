import type { Metadata } from "next";
import "./globals.css";
import { MosaicBackground } from "./components/MosaicBackground";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  Inter,
  DM_Sans,
  DM_Serif_Display,
  Cormorant_Garamond,
  Bangers,
} from "next/font/google";

/* ── Google Fonts via next/font (self-hosted, no render-blocking CSS) ── */

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-serif",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bangers",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thompsons.vercel.app"),
  alternates: {
    canonical: "/",
  },
  title: "Family Nest | Private. Permanent. Yours.",
  description:
    "A private space for families to document their lives together. Journals, photos, videos, voice memos, and more. Not social media. A family heirloom.",
  openGraph: {
    title: "Family Nest",
    description:
      "Document your family's life. Share it privately with the people who matter, no matter where they live.",
    url: "https://thompsons.vercel.app",
    siteName: "Family Nest",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Family Nest | Your Corner of the World",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Family Nest",
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
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} ${dmSerifDisplay.variable} ${cormorantGaramond.variable} ${bangers.variable}`}
    >
      <body className="antialiased">
        <MosaicBackground />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
