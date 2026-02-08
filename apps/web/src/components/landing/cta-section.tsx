"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Zap, Lock } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-6, 6, -6],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const pulseRing = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeOut",
    },
  },
};

export function CtaSection() {
  return (
    <section className="relative px-6 py-24 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="relative mx-auto max-w-4xl"
      >
        {/* Main CTA card */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent" />

          {/* Decorative patterns */}
          <div className="absolute inset-0">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%,transparent_100%),linear-gradient(to_bottom,transparent_0%,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%,transparent_100%)] bg-[size:60px_60px]" />
          </div>

          {/* Floating decorative elements */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={floatAnimation}
            className="absolute left-[10%] top-[20%] hidden lg:block"
          >
            <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-white/80" />
            </div>
          </motion.div>
          <motion.div
            initial="initial"
            animate="animate"
            variants={{ ...floatAnimation, animate: { ...floatAnimation.animate, transition: { ...floatAnimation.animate.transition, delay: 1.5 } } }}
            className="absolute bottom-[25%] right-[8%] hidden lg:block"
          >
            <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
              <Lock className="h-5 w-5 text-white/80" />
            </div>
          </motion.div>

          {/* Content */}
          <div className="relative p-10 text-center sm:p-16">
            {/* Icon with pulse effect */}
            <motion.div custom={0} variants={fadeIn} className="relative mx-auto mb-8 inline-block">
              <motion.div
                initial="initial"
                animate="animate"
                variants={pulseRing}
                className="absolute inset-0 rounded-full bg-white/30"
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/30">
                <ShieldCheck className="h-10 w-10 text-white" strokeWidth={1.5} />
              </div>
            </motion.div>

            <motion.h2
              custom={1}
              variants={fadeIn}
              className="font-serif text-3xl tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              Your vehicle deserves a voice.
            </motion.h2>

            <motion.p
              custom={2}
              variants={fadeIn}
              className="mx-auto mt-6 max-w-lg text-lg text-white/80"
            >
              Set up is free and takes under 5 minutes. Start receiving alerts the moment you activate your first vehicle.
            </motion.p>

            <motion.div custom={3} variants={fadeIn} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/login"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-10 py-4 text-base font-semibold text-primary shadow-xl transition-all hover:shadow-2xl hover:shadow-black/20"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Your SafeTag
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-white via-accent/10 to-white bg-[length:200%_100%] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              custom={4}
              variants={fadeIn}
              className="mt-10 flex flex-wrap items-center justify-center gap-6"
            >
              {[
                { icon: Sparkles, text: "Free to register" },
                { icon: ShieldCheck, text: "Privacy guaranteed" },
                { icon: Zap, text: "5 minute setup" },
              ].map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm"
                >
                  <badge.icon className="h-4 w-4" />
                  {badge.text}
                </div>
              ))}
            </motion.div>

            <motion.p
              custom={5}
              variants={fadeIn}
              className="mt-8 text-sm text-white/60"
            >
              Pay only when you activate alerts for a vehicle. Cancel anytime.
            </motion.p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
