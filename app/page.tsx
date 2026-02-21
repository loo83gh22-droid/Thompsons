import { Navbar } from "./components/home/Navbar";
import { HeroSection } from "./components/home/HeroSection";
import { HowItWorks } from "./components/home/HowItWorks";
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
      name: "Can I be in more than one family?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! If your son starts a Nest and your daughter starts a different one, you can be a member of both. You only need one account — no matter how many families you belong to.",
      },
    },
    {
      "@type": "Question",
      name: "I'm a grandparent — is this easy enough for me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. We designed Our Family Nest with grandparents in mind from day one. Big buttons, clear labels, and no confusing settings. If you can check email, you can use the Nest.",
      },
    },
    {
      "@type": "Question",
      name: "Who pays — me or the person who starts the Nest?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Only the Nest creator picks a plan. Everyone else joins for free. Members can belong to unlimited Nests with one account.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from Google Photos or iCloud?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google Photos and iCloud store photos, but Our Family Nest preserves your family's story. You get journals, voice memos, recipes, traditions, family trees, and a timeline\u2014all in one place. Plus, it's designed for sharing across generations, not just storing files.",
      },
    },
    {
      "@type": "Question",
      name: "Can I give this as a gift?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Start a Nest, upload some family photos, then invite the family. Many people wrap the login details on a card for Christmas or Mother\u2019s Day. The Legacy plan is especially popular as a gift since it\u2019s a one-time purchase that lasts forever.",
      },
    },
    {
      "@type": "Question",
      name: "Will my family actually use this?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "That\u2019s the number one concern we hear \u2014 and the answer is yes. The Nest is designed so everyone can contribute on their own terms. Dad posts a fishing photo, Grandma shares a recipe, the kids add a silly video. You don\u2019t have to be the family archivist. Once one person starts, others jump in naturally.",
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
  name: "Our Family Nest",
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
  name: "Our Family Nest",
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
        <HowItWorks />
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
