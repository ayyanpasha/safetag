"use client";

import { motion } from "framer-motion";
import { UserPlus, QrCode, Bell, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Sign up & add your vehicle",
    description:
      "Create your account in under a minute. Enter your vehicle number and we generate a unique SafeTag QR code for you — completely free.",
    highlights: ["Free account", "Instant QR generation", "No credit card required"],
  },
  {
    number: 2,
    icon: QrCode,
    title: "Stick the QR on your windshield",
    description:
      "Print or order your SafeTag sticker. Place it where it's visible — your dashboard, windshield, or rear window.",
    highlights: ["Print at home", "Weather-resistant", "Multiple placement options"],
  },
  {
    number: 3,
    icon: Bell,
    title: "Get contacted instantly",
    description:
      "Anyone who scans your QR can reach you via WhatsApp, anonymous VoIP call, or emergency report — without ever seeing your phone number.",
    highlights: ["WhatsApp alerts", "Anonymous calls", "Emergency reports"],
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.12 + 0.2, duration: 0.5, ease: "easeOut" },
  }),
};

const lineGrow = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { delay: 0.5, duration: 0.8, ease: "easeOut" },
  },
};

const iconFloat = {
  initial: { y: 0 },
  animate: {
    y: [-4, 4, -4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gradient-to-b from-secondary/50 via-secondary/30 to-background px-6 py-24 sm:py-32"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-1/2 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl">
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
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent"
            >
              <CheckCircle2 className="h-4 w-4" />
              How It Works
            </motion.div>
            <motion.h2
              custom={1}
              variants={fadeIn}
              className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl"
            >
              Three steps.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Five minutes.
              </span>{" "}
              Done.
            </motion.h2>
          </div>

          {/* Steps container with connecting lines */}
          <div className="relative">
            {/* Connecting line (desktop) */}
            <motion.div
              variants={lineGrow}
              className="absolute left-[16.67%] right-[16.67%] top-[60px] hidden h-0.5 origin-left bg-gradient-to-r from-primary via-accent to-primary md:block"
            />

            {/* Animated dots on line (desktop) */}
            <div className="absolute left-[16.67%] right-[16.67%] top-[60px] hidden md:block">
              <motion.div
                animate={{ x: ["0%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-2 w-2 -translate-y-1/2 rounded-full bg-accent shadow-lg shadow-accent/50"
              />
            </div>

            <div className="grid gap-8 md:grid-cols-3 md:gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  custom={i + 2}
                  variants={fadeIn}
                  className="group relative"
                >
                  <div className="relative flex flex-col items-center gap-6 text-center">
                    {/* Step number badge and icon container */}
                    <div className="relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl transition-all group-hover:scale-175 group-hover:opacity-75" />

                      {/* Icon container */}
                      <motion.div
                        initial="initial"
                        animate="animate"
                        variants={{ ...iconFloat, animate: { ...iconFloat.animate, transition: { ...iconFloat.animate.transition, delay: i * 0.5 } } }}
                        className="relative"
                      >
                        <div className={cn(
                          "flex h-20 w-20 items-center justify-center rounded-2xl",
                          "bg-gradient-to-br from-primary to-primary/80",
                          "shadow-xl shadow-primary/20",
                          "ring-4 ring-background",
                          "transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/30"
                        )}>
                          <step.icon className="h-9 w-9 text-primary-foreground" strokeWidth={1.5} />
                        </div>
                      </motion.div>

                      {/* Step number badge */}
                      <motion.span
                        custom={i + 2}
                        variants={scaleIn}
                        className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/80 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/30 ring-2 ring-background"
                      >
                        {step.number}
                      </motion.span>
                    </div>

                    {/* Arrow indicator between steps (mobile) */}
                    {i < steps.length - 1 && (
                      <div className="flex items-center justify-center py-2 md:hidden">
                        <motion.div
                          animate={{ y: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-5 w-5 rotate-90 text-muted-foreground" />
                        </motion.div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>

                    {/* Highlights */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {step.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors group-hover:bg-primary/15"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
