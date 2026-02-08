"use client";

import { motion } from "framer-motion";
import { ParkingCircle, Siren, Truck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const problems = [
  {
    icon: ParkingCircle,
    title: "Wrong parking, no way to contact",
    story:
      "You come back to your car and someone is blocked in behind you. They honk, wait, get frustrated — and eventually call a tow truck. All because they couldn't reach you in time.",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10",
    gradient: "from-red-500/20 via-red-500/5 to-transparent",
    borderColor: "hover:border-red-500/30",
    shadowColor: "group-hover:shadow-red-500/10",
  },
  {
    icon: Siren,
    title: "An emergency, and your car is in the way",
    story:
      "An ambulance needs to get through. Your car is blocking the lane. Bystanders are helpless — there's no number on your dashboard, no way to move your vehicle.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    borderColor: "hover:border-amber-500/30",
    shadowColor: "group-hover:shadow-amber-500/10",
  },
  {
    icon: Truck,
    title: "Towed without warning",
    story:
      "The municipality tows your car. You had no idea it was in a no-parking zone. If only someone could have warned you before the truck arrived.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    borderColor: "hover:border-blue-500/30",
    shadowColor: "group-hover:shadow-blue-500/10",
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

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -8,
    transition: { duration: 0.3, ease: "easeOut" }
  },
};

const iconHover = {
  rest: { rotate: 0, scale: 1 },
  hover: {
    rotate: [0, -10, 10, 0],
    scale: 1.1,
    transition: { duration: 0.5 }
  },
};

export function ProblemSection() {
  return (
    <section id="problem" className="relative px-6 py-24 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
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
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              The Problem
            </motion.div>
            <motion.h2
              custom={1}
              variants={fadeIn}
              className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl"
            >
              Your phone number isn&apos;t on your car.
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground/60 bg-clip-text text-transparent">
                {" "}And that&apos;s a problem.
              </span>
            </motion.h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                custom={i + 2}
                variants={fadeIn}
                initial="rest"
                whileHover="hover"
                className="group"
              >
                <motion.div
                  variants={cardHover}
                  className={cn(
                    "relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border p-7",
                    "bg-card transition-all duration-300",
                    p.borderColor,
                    "shadow-lg shadow-transparent",
                    p.shadowColor
                  )}
                >
                  {/* Gradient overlay on hover */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    p.gradient
                  )} />

                  <div className="relative">
                    <motion.div
                      variants={iconHover}
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl",
                        p.bg,
                        "ring-4 ring-transparent transition-all group-hover:ring-white/50 dark:group-hover:ring-white/10"
                      )}
                    >
                      <p.icon className={cn("h-7 w-7", p.color)} strokeWidth={1.5} />
                    </motion.div>
                  </div>

                  <h3 className="relative text-lg font-semibold leading-snug">
                    {p.title}
                  </h3>

                  <p className="relative text-sm leading-relaxed text-muted-foreground">
                    {p.story}
                  </p>

                  {/* Bottom accent line */}
                  <div className={cn(
                    "absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full",
                    p.bg
                  )} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
