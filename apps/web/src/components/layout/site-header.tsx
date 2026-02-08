"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, ShieldCheck, X, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { href: "/#problem", label: "Why SafeTag" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#reviews", label: "Reviews" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative rounded-lg bg-gradient-to-br from-primary to-teal-500 p-1.5">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            SafeTag
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground group"
            >
              <span className="relative z-10">{link.label}</span>
              <span className="absolute inset-0 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop CTA Button */}
          <Button
            asChild
            className="hidden md:inline-flex rounded-full px-6 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] group"
          >
            <Link href="/auth/login" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              Get Your SafeTag
            </Link>
          </Button>

          {/* Mobile Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden relative overflow-hidden group"
                aria-label="Open menu"
              >
                <span className="absolute inset-0 bg-gradient-to-br from-primary/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                <Menu className="h-5 w-5 relative z-10 transition-transform group-hover:scale-110" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-80 p-0 bg-gradient-to-b from-background to-background/95 border-l border-border/50"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setOpen(false)}
                >
                  <div className="rounded-lg bg-gradient-to-br from-primary to-teal-500 p-1.5">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-serif text-lg font-semibold">SafeTag</span>
                </Link>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex flex-col p-4 space-y-1">
                {navLinks.map((link, index) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between p-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              {/* Mobile CTA */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-gradient-to-t from-background to-transparent">
                <SheetClose asChild>
                  <Button
                    asChild
                    className="w-full rounded-full bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-lg shadow-primary/25"
                  >
                    <Link href="/auth/login" className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Get Your SafeTag
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
