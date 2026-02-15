import { Navbar } from "./components/home/Navbar";
import { HeroSection } from "./components/home/HeroSection";
import { TrustBar } from "./components/home/TrustBar";
import { FeaturesBento } from "./components/home/FeaturesBento";
import { AdditionalFeatures } from "./components/home/AdditionalFeatures";
import { EmotionalSection } from "./components/home/EmotionalSection";
import { PricingCards } from "./components/home/PricingCards";
import { FinalCTA } from "./components/home/FinalCTA";
import { Footer } from "./components/home/Footer";

export default function HomePage() {
  return (
    <div className="landing" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <FeaturesBento />
        <AdditionalFeatures />
        <EmotionalSection />
        <PricingCards />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
