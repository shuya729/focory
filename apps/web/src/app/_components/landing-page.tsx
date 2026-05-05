import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import LandingCtaSection from "./landing-cta-section";
import LandingFeaturesSection from "./landing-features-section";
import LandingHeroSection from "./landing-hero-section";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
