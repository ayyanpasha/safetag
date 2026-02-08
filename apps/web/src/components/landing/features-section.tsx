"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  PhoneOff,
  AlertTriangle,
  BellOff,
  Car,
  Shield,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const features = [
  {
    icon: MessageSquare,
    title: "WhatsApp alerts",
    description: "Scanner picks a problem type and you get a WhatsApp message in seconds. No app install needed on their end.",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-500/10",
    gradient: "from-green-500/10 to-transparent",
    accentColor: "group-hover:border-green-500/30",
  },
  {
    icon: PhoneOff,
    title: "Anonymous VoIP calls",
    description: "Scanners can call you directly through our VoIP bridge. Your real number stays private — always.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    gradient: "from-purple-500/10 to-transparent",
    accentColor: "group-hover:border-purple-500/30",
  },
  {
    icon: AlertTriangle,
    title: "Emergency reports with photos",
    description: "Accident? Vandalism? Theft? Scanners can file a detailed report with photos, GPS location, and emergency type.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10",
    gradient: "from-red-500/10 to-transparent",
    accentColor: "group-hover:border-red-500/30",
  },
  {
    icon: BellOff,
    title: "Do Not Disturb scheduling",
    description: "Set quiet hours and messages queue up. They'll be delivered the moment your DND window ends.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    gradient: "from-amber-500/10 to-transparent",
    accentColor: "group-hover:border-amber-500/30",
  },
  {
    icon: Car,
    title: "Unlimited vehicles, one dashboard",
    description: "Manage your car, bike, truck — all from one account. Each vehicle gets its own unique QR code.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    gradient: "from-blue-500/10 to-transparent",
    accentColor: "group-hover:border-blue-500/30",
  },
  {
    icon: Shield,
    title: "Complete privacy for everyone",
    description: "Scanners never see your phone number. You never see theirs (unless it's an emergency). Privacy by design.",
    color: "text-primary",
    bg: "bg-primary/10",
    gradient: "from-primary/10 to-transparent",
    accentColor: "group-hover:border-primary/30",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" },
  }),
};

const iconHover = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.15,
    rotate: 5,
    transition: { duration: 0.3, ease: "easeOut" }
  },
};

export function FeaturesSection() {
  return (
    <section className="relative px-6 py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
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
              Features
            </motion.div>
            <motion.h2
              custom={1}
              variants={fadeIn}
              className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl"
            >
              Not just a QR code.
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {" "}A complete vehicle protection system.
              </span>
            </motion.h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i + 2}
                variants={fadeIn}
                initial="rest"
                whileHover="hover"
                className="group relative"
              >
                <div
                  className={cn(
                    "relative h-full overflow-hidden rounded-2xl border p-6",
                    "bg-card transition-all duration-300",
                    "hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5",
                    f.accentColor
                  )}
                >
                  {/* Gradient overlay */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    f.gradient
                  )} />

                  <div className="relative flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <motion.div
                        variants={iconHover}
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl",
                          f.bg,
                          "ring-2 ring-transparent transition-all group-hover:ring-white/20"
                        )}
                      >
                        <f.icon className={cn("h-6 w-6", f.color)} strokeWidth={1.5} />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{f.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {f.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom accent bar */}
                  <div className={cn(
                    "absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full",
                    f.bg
                  )} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
