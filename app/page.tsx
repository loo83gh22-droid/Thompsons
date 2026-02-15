import { Navbar } from "./components/home/Navbar";
import { HeroSection } from "./components/home/HeroSection";
import { FamilyMosaic } from "./components/home/FamilyMosaic";
import { FeaturesBento } from "./components/home/FeaturesBento";
import { AdditionalFeatures } from "./components/home/AdditionalFeatures";
import { Testimonials } from "./components/home/Testimonials";
import { EmotionalSection } from "./components/home/EmotionalSection";
import { HomepageFAQ } from "./components/home/HomepageFAQ";
import { PricingCards } from "./components/home/PricingCards";
import { FinalCTA } from "./components/home/FinalCTA";
import { Footer } from "./components/home/Footer";

export default function HomePage() {
  return (
    <div className="landing" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <main>
        <HeroSection />
        <FamilyMosaic />
        <FeaturesBento />
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
