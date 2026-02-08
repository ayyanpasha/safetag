"use client";

import { motion } from "framer-motion";
import { Star, BadgeCheck, Quote, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const testimonials = [
  {
    quote: "I was about to get towed at a hospital. Someone scanned my SafeTag and I ran out and moved my car in 3 minutes. This thing literally saved me Rs.5,000.",
    name: "Rahul Menon",
    location: "Bangalore",
    vehicle: "Honda City",
    avatar: "RM",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    quote: "I manage 12 delivery bikes. We used to get constant complaints about parking. Now people just scan the QR and we handle it instantly. Complaints down 80%.",
    name: "Priya Sharma",
    location: "Mumbai",
    vehicle: "Fleet Manager",
    avatar: "PS",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    quote: "Someone hit my parked car and actually reported it through SafeTag with photos. I couldn't believe a stranger took the time — because it was so easy.",
    name: "Arjun Krishnan",
    location: "Delhi",
    vehicle: "Hyundai Creta",
    avatar: "AK",
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  {
    quote: "My wife's car was parked in a lane during a medical emergency. A bystander scanned the QR and called her through the app. No one needed her number.",
    name: "Deepak Joshi",
    location: "Pune",
    vehicle: "Maruti Swift",
    avatar: "DJ",
    color: "bg-gradient-to-br from-amber-500 to-amber-600",
  },
  {
    quote: "I put SafeTags on both my cars and my father's. The DND feature is perfect — no calls during meetings, everything queues up and arrives after.",
    name: "Sneha Reddy",
    location: "Hyderabad",
    vehicle: "3 vehicles",
    avatar: "SR",
    color: "bg-gradient-to-br from-pink-500 to-pink-600",
  },
  {
    quote: "As a dealer, I've referred 40+ customers. The affiliate commission is solid and my customers love the product. Win-win.",
    name: "Vikram Auto",
    location: "Chennai",
    vehicle: "SafeTag Dealer",
    avatar: "VA",
    color: "bg-gradient-to-br from-teal-500 to-teal-600",
  },
];

// Duplicate for infinite scroll
const allTestimonials = [...testimonials, ...testimonials];

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

export function Testimonials() {
  return (
    <section id="reviews" className="relative overflow-hidden px-6 py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-transparent to-secondary/30" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="flex flex-col gap-12"
      >
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            custom={0}
            variants={fadeIn}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          >
            <MessageCircle className="h-4 w-4" />
            Reviews
          </motion.div>
          <motion.h2
            custom={1}
            variants={fadeIn}
            className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl"
          >
            Real stories from{" "}
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              real owners.
            </span>
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeIn}
            className="mt-4 text-muted-foreground"
          >
            Join thousands of vehicle owners who trust SafeTag to keep them connected.
          </motion.p>
        </div>

        {/* Scrolling carousel */}
        <motion.div custom={3} variants={fadeIn} className="relative">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

          <div
            className="flex gap-6 animate-scroll-left"
            style={{ "--scroll-speed": "45s", width: "max-content" } as React.CSSProperties}
          >
            {allTestimonials.map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className={cn(
                  "group w-[380px] shrink-0 flex flex-col gap-5 rounded-2xl border p-6",
                  "bg-card/80 backdrop-blur-sm",
                  "transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                )}
              >
                {/* Quote icon and stars */}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Quote className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Quote text */}
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author info */}
                <div className="flex items-center gap-4 border-t pt-5">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg",
                    t.color
                  )}>
                    {t.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      {t.name}
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {t.vehicle} &middot; {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          custom={4}
          variants={fadeIn}
          className="mx-auto flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { value: "2,000+", label: "Happy Owners" },
            { value: "4.9/5", label: "Average Rating" },
            { value: "10,000+", label: "Scans Processed" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-6">
              {i > 0 && <div className="hidden h-8 w-px bg-border sm:block" />}
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
