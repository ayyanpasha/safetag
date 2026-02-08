import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaSection } from "@/components/landing/cta-section";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <ProblemSection />
        <HowItWorks />
        <FeaturesSection />
        <PricingSection />
        <Testimonials />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
