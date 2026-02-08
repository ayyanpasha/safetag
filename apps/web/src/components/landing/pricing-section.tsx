"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PLAN_DETAILS, type PlanType } from "@safetag/shared-types";

const planMeta: Record<
  PlanType,
  { label: string; period: string; perMonth: number; badge?: string; savings?: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  MONTHLY: { label: "Monthly", period: "month", perMonth: 299, icon: Zap },
  QUARTERLY: {
    label: "Quarterly",
    period: "quarter",
    perMonth: Math.round(499 / 3),
    badge: "Most Popular",
    savings: "Save 44% vs monthly",
    icon: Sparkles,
  },
  SEMI_ANNUAL: {
    label: "Semi-Annual",
    period: "6 months",
    perMonth: Math.round(699 / 6),
    savings: "Save 61% vs monthly",
    icon: Sparkles,
  },
  YEARLY: {
    label: "Yearly",
    period: "year",
    perMonth: Math.round(999 / 12),
    badge: "Best Value",
    savings: "Save 72% vs monthly",
    icon: Crown,
  },
};

const plans = (Object.keys(PLAN_DETAILS) as PlanType[]).map((key) => ({
  key,
  ...PLAN_DETAILS[key],
  ...planMeta[key],
}));

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const scaleIn = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-secondary/50 via-secondary/30 to-background px-6 py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute left-0 top-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-primary/5 to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 right-0 h-96 w-96 rounded-full bg-gradient-to-l from-accent/5 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="flex flex-col gap-16"
        >
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              custom={0}
              variants={fadeIn}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"
            >
              <Sparkles className="h-4 w-4" />
              Pricing
            </motion.div>
            <motion.h2
              custom={1}
              variants={fadeIn}
              className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl"
            >
              One subscription per vehicle.
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {" "}Simple as that.
              </span>
            </motion.h2>
            <motion.p
              custom={2}
              variants={fadeIn}
              className="mt-6 text-lg text-muted-foreground"
            >
              Register vehicles and generate QR codes for free. To{" "}
              <strong className="text-foreground">receive</strong> complaints, calls, and alerts for a vehicle, activate a subscription for it.
            </motion.p>
          </div>

          <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, i) => {
              const isPopular = plan.badge === "Most Popular";
              const isBest = plan.badge === "Best Value";
              const IconComponent = plan.icon;

              return (
                <motion.div
                  key={plan.key}
                  custom={i + 3}
                  variants={scaleIn}
                  className="group relative"
                >
                  <div
                    className={cn(
                      "relative flex h-full flex-col gap-6 overflow-hidden rounded-2xl border p-6",
                      "bg-card transition-all duration-300",
                      "hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5",
                      isPopular && "ring-2 ring-accent shadow-lg shadow-accent/10 hover:shadow-accent/20",
                      isBest && "ring-2 ring-primary shadow-lg shadow-primary/10 hover:shadow-primary/20"
                    )}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      isPopular ? "from-accent/5 to-transparent" : isBest ? "from-primary/5 to-transparent" : "from-muted/50 to-transparent"
                    )} />

                    {/* Badge */}
                    {plan.badge && (
                      <span
                        className={cn(
                          "absolute -top-px left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-b-xl px-4 py-1.5 text-xs font-semibold",
                          isPopular
                            ? "bg-gradient-to-r from-accent to-accent/90 text-accent-foreground"
                            : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                        )}
                      >
                        {IconComponent && <IconComponent className="h-3 w-3" />}
                        {plan.badge}
                      </span>
                    )}

                    <div className="relative pt-4">
                      <div className="flex items-center gap-2">
                        {IconComponent && (
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            isPopular ? "bg-accent/10 text-accent" : isBest ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                        )}
                        <h3 className="font-semibold">{plan.label}</h3>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-baseline gap-1">
                          <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-4xl font-bold text-transparent">
                            Rs.{plan.price}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /{plan.period}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          per vehicle
                          {plan.perMonth < plan.price && (
                            <span className="ml-1 text-xs">
                              &middot; Rs.{plan.perMonth}/mo effective
                            </span>
                          )}
                        </p>
                      </div>

                      {plan.savings && (
                        <p className={cn(
                          "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                          isPopular ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                        )}>
                          <Sparkles className="h-3 w-3" />
                          {plan.savings}
                        </p>
                      )}
                    </div>

                    <ul className="relative flex flex-col gap-3 text-sm text-muted-foreground">
                      {[
                        "WhatsApp, VoIP & emergency alerts",
                        `Up to ${plan.vehicleLimit} vehicles on this plan`,
                        "DND scheduling & incident dashboard",
                        "Cancel anytime",
                      ].map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <div className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            isPopular ? "bg-accent/10" : "bg-primary/10"
                          )}>
                            <Check className={cn(
                              "h-2.5 w-2.5",
                              isPopular ? "text-accent" : "text-primary"
                            )} strokeWidth={3} />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/auth/login"
                      className={cn(
                        "group/btn relative mt-auto flex items-center justify-center gap-2 overflow-hidden rounded-full py-3 text-sm font-semibold transition-all",
                        isPopular
                          ? "bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:shadow-lg hover:shadow-accent/25"
                          : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
                      )}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            custom={8}
            variants={fadeIn}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="rounded-2xl border bg-card/50 p-6 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">
                All plans include the same features. Higher tiers allow more vehicles per account.
                Prices are per-vehicle — subscribe only for vehicles you want to protect.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                {["No hidden fees", "Cancel anytime", "Secure payments"].map((item) => (
                  <span key={item} className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
