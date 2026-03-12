"use client";

import Script from "next/script";

const META_PIXEL_ID = "1296260982556890";

/**
 * Meta (Facebook) Pixel — loads the fbq snippet and fires a PageView on every page.
 * Conversion events (CompleteRegistration, Lead, ViewContent) are fired from
 * the `fbq` helper exported below.
 */
export default function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/* ── Helper: fire standard Meta Pixel events from client components ── */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fire a Meta Pixel standard or custom event.
 * Safe to call even if the pixel hasn't loaded yet (no-ops gracefully).
 *
 * Usage:
 *   fbqTrack("CompleteRegistration");
 *   fbqTrack("Lead", { content_name: "Pricing Page" });
 *   fbqTrack("ViewContent", { content_name: "Homepage CTA" });
 */
export function fbqTrack(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== "undefined" && window.fbq) {
    if (params) {
      window.fbq("track", eventName, params);
    } else {
      window.fbq("track", eventName);
    }
  }
}
