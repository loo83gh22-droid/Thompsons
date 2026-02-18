import { Navbar } from "./components/home/Navbar";
import { HeroSection } from "./components/home/HeroSection";
import { FeaturesBento } from "./components/home/FeaturesBento";
import { AdditionalFeatures } from "./components/home/AdditionalFeatures";
import { WorldMapSection } from "./components/home/WorldMapSection";
import { Testimonials } from "./components/home/Testimonials";
import { EmotionalSection } from "./components/home/EmotionalSection";
import { HomepageFAQ } from "./components/home/HomepageFAQ";
import { PricingCards } from "./components/home/PricingCards";
import { FinalCTA } from "./components/home/FinalCTA";
import { Footer } from "./components/home/Footer";

/* ── JSON-LD Structured Data ────────────────────────────────── */

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is my family's data private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Your Family Nest is completely private by default. Only family members you invite can see your content. We use bank-level encryption, and your data is stored on secure US-based servers. Unlike social media, we never sell your data or show ads.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if I stop paying?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can downgrade to the Free plan anytime and keep your first 10 journal entries and 500 MB of photos forever. No data is ever deleted when you downgrade. If you choose the Legacy plan, you own it for life\u2014no recurring payments, ever.",
      },
    },
    {
      "@type": "Question",
      name: "Can my 80-year-old grandma actually use this?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! We designed Family Nest to be simple enough for grandparents who struggle with tech. Big buttons, clear labels, and no confusing settings. Many families tell us their grandparents check the Nest daily\u2014it's that easy.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from Google Photos or iCloud?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google Photos and iCloud store photos, but Family Nest preserves your family's story. You get journals, voice memos, recipes, traditions, family trees, and a timeline\u2014all in one place. Plus, it's designed for sharing across generations, not just storing files.",
      },
    },
    {
      "@type": "Question",
      name: "Can I import my existing photos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! You can bulk upload photos from your phone, computer, Google Photos, or iCloud. We support all common formats (JPG, PNG, HEIC) and organize them automatically by date and family member.",
      },
    },
  ],
};

const softwareStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Family Nest",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description:
    "A private space for families to document their lives together. Journals, photos, videos, voice memos, and more. Not social media. A family heirloom.",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "The Nest (Free)",
      description: "10 journal entries, 500 MB storage, family tree, map view",
    },
    {
      "@type": "Offer",
      price: "49.00",
      priceCurrency: "USD",
      name: "The Full Nest",
      description:
        "Unlimited entries, 10 GB storage, videos & voice memos, all core features",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "49.00",
        priceCurrency: "USD",
        billingDuration: "P1Y",
      },
    },
    {
      "@type": "Offer",
      price: "349.00",
      priceCurrency: "USD",
      name: "The Legacy",
      description:
        "Lifetime access, 50 GB storage, ownership transfer, full data export",
    },
  ],
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Family Nest",
  url: "https://thompsons.vercel.app",
  logo: "https://thompsons.vercel.app/og-image.jpg",
  description:
    "A private, permanent space for families to preserve their memories together.",
};

export default function HomePage() {
  return (
    <div className="landing" style={{ fontFamily: "var(--font-body)" }}>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />

      <Navbar />
      <main>
        <HeroSection />
        <FeaturesBento />
        <WorldMapSection />
        <AdditionalFeatures />
        <Testimonials />
        <EmotionalSection />
        <HomepageFAQ />
        <PricingCards />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
