import type { Metadata } from "next";
import "./globals.css";
import { MosaicBackground } from "./components/MosaicBackground";

export const metadata: Metadata = {
  title: "Our Family Nest | Your Corner of the World",
  description: "A private space for your family — travels, memories, and growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <MosaicBackground />
        {children}
      </body>
    </html>
  );
}
