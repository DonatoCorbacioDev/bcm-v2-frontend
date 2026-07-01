"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // See comment in original layout: needed to avoid SSR-hydration mismatch.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!accessToken) {
      api
        .post<{ token: string }>("/auth/refresh")
        .then((res) => setAccessToken(res.data.token))
        .catch(() => {
          clearAuth();
          router.push("/login");
        });
    }
  }, [hasMounted, isAuthenticated, accessToken, router, setAccessToken, clearAuth]);

  const isRestoringSession = isAuthenticated && !accessToken;

  if (!hasMounted || !isAuthenticated || isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Verifica autenticazione…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-primary focus:rounded focus:shadow-lg focus:outline-none"
      >
        Vai al contenuto principale
      </a>

      {/* Desktop sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Mobile sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-20 md:hidden cursor-default"
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") setIsMobileMenuOpen(false);
          }}
          aria-label="Chiudi menu"
        />
      )}

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          collapsed={collapsed}
          onCollapseToggle={() => setCollapsed((c) => !c)}
          onMenuClick={() => setIsMobileMenuOpen((o) => !o)}
          isMenuOpen={isMobileMenuOpen}
        />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1320px] mx-auto w-full"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
