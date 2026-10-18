"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Topbar } from "@/components/layout/topbar";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-3">
        <div className="h-9 w-9 rounded-full border-3 border-secjessica-600 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando SecJessica…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <Sidebar open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />
      <div className="flex flex-col flex-1 w-full overflow-hidden md:pl-64 relative">
        <Topbar onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-secondary p-4 sm:p-6 lg:p-8 pb-20 sm:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
