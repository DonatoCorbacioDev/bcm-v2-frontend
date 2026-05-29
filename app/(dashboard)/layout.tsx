"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Verifying authentication...</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Skip navigation — visually hidden until focused (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-700 focus:rounded focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <Header
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMenuOpen={isMobileMenuOpen}
      />

      <div className="flex h-full pt-16">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main
          id="main-content"
          className="flex-1 min-w-0 md:ml-64 overflow-y-auto p-4 md:p-8"
        >
          {children}
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden cursor-default"
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
              setIsMobileMenuOpen(false);
            }
          }}
          aria-label="Close menu"
        />
      )}
    </div>
  );
}