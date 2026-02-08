import { HowItWorks } from "@/components/landing/how-it-works";
import { FeaturesSection } from "@/components/landing/features-section";
import { CtaSection } from "@/components/landing/cta-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — SafeTag",
  description: "Learn how SafeTag protects your vehicle with QR-based instant contact.",
};

export default function HowItWorksPage() {
  return (
    <div className="py-12">
      <HowItWorks />
      <FeaturesSection />
      <CtaSection />
    </div>
  );
}
