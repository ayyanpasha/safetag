import { PricingSection } from "@/components/landing/pricing-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — SafeTag",
  description: "Simple, transparent pricing for SafeTag vehicle protection plans.",
};

export default function PricingPage() {
  return (
    <div className="py-12">
      <PricingSection />
    </div>
  );
}
