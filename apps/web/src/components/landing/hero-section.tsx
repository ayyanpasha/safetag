"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star, Sparkles, Shield, Zap } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const pulseAnimation = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-28 sm:pb-32 sm:pt-40">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <motion.div
          initial="initial"
          animate="animate"
          variants={pulseAnimation}
          className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-3xl"
        />
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ ...pulseAnimation, animate: { ...pulseAnimation.animate, transition: { ...pulseAnimation.animate.transition, delay: 1.5 } } }}
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary/15 via-accent/10 to-transparent blur-3xl"
        />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,hsl(var(--border)/0.3)_50%,transparent_51%,transparent_100%),linear-gradient(to_bottom,transparent_0%,transparent_49%,hsl(var(--border)/0.3)_50%,transparent_51%,transparent_100%)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      {/* Floating decorative elements */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={floatAnimation}
        className="absolute left-[10%] top-[20%] hidden lg:block"
      >
        <div className="rounded-2xl border border-border/50 bg-card/50 p-3 shadow-lg backdrop-blur-sm">
          <Shield className="h-6 w-6 text-primary" />
        </div>
      </motion.div>
      <motion.div
        initial="initial"
        animate="animate"
        variants={{ ...floatAnimation, animate: { ...floatAnimation.animate, transition: { ...floatAnimation.animate.transition, delay: 2 } } }}
        className="absolute right-[15%] top-[30%] hidden lg:block"
      >
        <div className="rounded-2xl border border-border/50 bg-card/50 p-3 shadow-lg backdrop-blur-sm">
          <Zap className="h-6 w-6 text-accent" />
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-8"
        >
          {/* Social proof pill */}
          <motion.div
            custom={0}
            variants={fadeIn}
            className="group inline-flex items-center gap-3 rounded-full border border-border/50 bg-card/80 px-5 py-2.5 text-sm shadow-lg backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-primary/5"
          >
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-muted-foreground">
              Trusted by <span className="font-semibold text-foreground">2,000+</span> vehicle owners
            </span>
            <Sparkles className="h-4 w-4 text-accent transition-transform group-hover:rotate-12" />
          </motion.div>

          {/* Headline with gradient text */}
          <motion.h1
            custom={1}
            variants={fadeIn}
            className="font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your car can&apos;t talk.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Now it doesn&apos;t have to.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            custom={2}
            variants={fadeIn}
            className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Someone double-parks behind you. Your lights are on. There&apos;s a dent
            you didn&apos;t know about. Without SafeTag, no one can reach you.{" "}
            <strong className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-semibold text-transparent">
              Stick a QR on your windshield and let anyone contact you instantly.
            </strong>
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3}
            variants={fadeIn}
            className="flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              href="/auth/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-accent to-accent/90 px-8 py-4 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Your SafeTag
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] opacity-0 transition-opacity group-hover:opacity-100 group-hover:animate-[shimmer_2s_infinite]" />
            </Link>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-8 py-4 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card hover:text-foreground"
            >
              <span>See how it works</span>
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-4 w-4 rotate-90" />
              </motion.span>
            </a>
          </motion.div>

          {/* Quick stats with enhanced styling */}
          <motion.div
            custom={4}
            variants={fadeIn}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
          >
            {[
              { value: "5 min", label: "Setup time", icon: Zap },
              { value: "3 ways", label: "To reach you", icon: Shield },
              { value: "100%", label: "Anonymous for scanners", icon: Sparkles },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-4">
                {i > 0 && <div className="hidden h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent sm:block" />}
                <div className="group flex flex-col items-center gap-2 rounded-2xl border border-transparent p-4 transition-all hover:border-border/50 hover:bg-card/50">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-accent" />
                    <p className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                      {stat.value}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
