import Link from "next/link";
import { ShieldCheck, Twitter, Github, Linkedin, Mail, Heart, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  Product: [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#reviews", label: "Reviews" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  Support: [
    { href: "/contact", label: "Contact Us" },
    { href: "/#problem", label: "FAQ" },
  ],
};

const socialLinks = [
  { href: "https://twitter.com/safetag", label: "Twitter", icon: Twitter },
  { href: "https://github.com/safetag", label: "GitHub", icon: Github },
  { href: "https://linkedin.com/company/safetag", label: "LinkedIn", icon: Linkedin },
  { href: "mailto:hello@safetag.in", label: "Email", icon: Mail },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl opacity-50" />

      <div className="container relative py-16">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative rounded-lg bg-gradient-to-br from-primary to-teal-500 p-1.5">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="font-serif text-xl font-semibold">SafeTag</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A smarter way to connect with people around your vehicle.
              Privacy-first. Instant. Free to start.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group"
                  asChild
                >
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 via-teal-500/10 to-primary/10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Stay updated</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get the latest news and updates from SafeTag.
              </p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 h-10 px-4 rounded-full border bg-background/50 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <Button
                type="submit"
                className="rounded-full px-6 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-md shadow-primary/20"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            &copy; {new Date().getFullYear()} SafeTag. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
}
