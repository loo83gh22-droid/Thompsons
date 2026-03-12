"use client";

import { useEffect } from "react";
import { fbqTrack } from "@/app/components/MetaPixel";

/**
 * Fires a Meta Pixel "Lead" event when the pricing page mounts.
 * Rendered as a hidden component inside the pricing page.
 */
export function PricingPixelEvent() {
  useEffect(() => {
    fbqTrack("Lead", { content_name: "Pricing Page" });
  }, []);
  return null;
}
