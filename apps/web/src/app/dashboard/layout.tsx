"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth({ required: true });

  if (!isAuthenticated && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <main id="main-content" className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
