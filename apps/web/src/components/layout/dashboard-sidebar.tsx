"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  AlertTriangle,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  Shield,
  ChevronRight,
  Bell,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, description: "Overview & stats" },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: Car, description: "Manage your vehicles" },
  { href: "/dashboard/incidents", label: "Incidents", icon: AlertTriangle, description: "View reports" },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, description: "Billing & plans" },
  { href: "/dashboard/affiliate", label: "Affiliate", icon: Users, description: "Earn rewards" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, description: "Preferences" },
];

function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/95">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border/50 px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal-500 rounded-lg blur-sm opacity-50" />
          <div className="relative rounded-lg bg-gradient-to-br from-primary to-teal-500 p-1.5">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </div>
        <span className="font-serif text-xl font-semibold tracking-tight">SafeTag</span>
        {!isMobile && (
          <span className="ml-auto flex h-5 items-center rounded-full bg-gradient-to-r from-primary/20 to-teal-500/20 px-2 text-[10px] font-medium text-primary">
            PRO
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-border/50">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-9 rounded-lg border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all group"
          asChild
        >
          <Link href="/dashboard/vehicles/new">
            <Sparkles className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
            <span className="text-sm">Add New Vehicle</span>
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {/* Active background */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-teal-500 shadow-md shadow-primary/25" />
              )}

              {/* Icon container */}
              <div
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-white/20"
                    : "bg-accent/50 group-hover:bg-accent"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                )} />
              </div>

              {/* Label */}
              <div className="relative flex-1">
                <span className={cn(isActive && "text-white")}>{item.label}</span>
                <span className={cn(
                  "block text-[11px] transition-colors",
                  isActive ? "text-white/70" : "text-muted-foreground/60"
                )}>
                  {item.description}
                </span>
              </div>

              {/* Arrow indicator */}
              <ChevronRight
                className={cn(
                  "relative h-4 w-4 transition-all duration-200",
                  isActive
                    ? "text-white/70 translate-x-0 opacity-100"
                    : "text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                )}
              />
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-teal-500/10 to-primary/10 p-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-teal-500/20 rounded-full blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Upgrade to Pro</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Get unlimited vehicles & priority support
            </p>
            <Button
              size="sm"
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 text-xs h-8"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="border-t border-border/50 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-accent/50 transition-all group">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">john@example.com</p>
              </div>
              <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-border/50 h-screen sticky top-0 bg-gradient-to-b from-background via-background to-background/95">
        <SidebarContent />
      </aside>

      {/* Mobile trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-40 md:hidden h-10 w-10 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm shadow-lg shadow-black/5 hover:bg-accent transition-all"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 border-r-border/50">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    </>
  );
}
