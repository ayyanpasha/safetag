"use client";

import Link from "next/link";
import { ShieldX, ArrowRight, QrCode, Bell, Phone, ShieldCheck, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: QrCode,
    title: "Instant QR Contact",
    description: "Anyone can scan your QR to reach you without knowing your number.",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description: "Get WhatsApp and push notifications when someone needs to reach you about your vehicle.",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    icon: Phone,
    title: "Anonymous VoIP Calls",
    description: "Receive calls from strangers without exposing your personal phone number.",
    gradient: "from-purple-500 to-violet-600",
  },
  {
    icon: ShieldCheck,
    title: "Emergency Reporting",
    description: "Bystanders can report accidents, damage, or emergencies with photos - instantly.",
    gradient: "from-orange-500 to-amber-600",
  },
];

export function InvalidQR() {
  return (
    <div className="w-full max-w-lg mx-auto px-4">
      {/* Invalid state card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 p-8 text-white shadow-xl shadow-red-500/20">
        {/* Background decoration */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute left-0 bottom-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 mb-5">
            <ShieldX className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold">This QR Code is Invalid</h1>
          <p className="mt-3 text-white/80 max-w-sm mx-auto">
            The SafeTag QR you scanned doesn&apos;t exist or has been deactivated.
            It may be a counterfeit or expired sticker.
          </p>
        </div>
      </div>

      {/* Product pitch */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>SafeTag for Vehicles</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Want this for <span className="text-primary">your</span> vehicle?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
            SafeTag lets anyone contact you about your parked vehicle - without
            ever sharing your phone number.
          </p>
        </div>

        <div className="grid gap-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex gap-4 rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${b.gradient} text-white shadow-lg`}>
                <b.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{b.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Your SafeTag - Free to Start
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Setup is free. Takes under 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
