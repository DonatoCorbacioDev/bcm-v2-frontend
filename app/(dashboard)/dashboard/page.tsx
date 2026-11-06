"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useHomeAttention } from "@/hooks/useHomeAttention";
import { useAuthStore } from "@/store/authStore";
import { businessAreasService } from "@/services/businessAreas.service";
import { managersService } from "@/services/managers.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";
import { CalendarClock, FileText, Landmark } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import KPICardSkeleton from "@/components/dashboard/KPICardSkeleton";
import { HomeAttentionList } from "@/components/dashboard/HomeAttentionList";
import { SupplierInvoicesSummary } from "@/components/dashboard/SupplierInvoicesSummary";
import { AnalyticsSections } from "@/components/dashboard/AnalyticsSections";

/** The former charts and AI widgets, off until their numbers are reliable (see AnalyticsSections). */
const SHOW_ANALYTICS = process.env.NEXT_PUBLIC_HOME_ANALYTICS === "true";

/**
 * Home: what needs attention in the next days (notice deadlines, expiries,
 * invoices to match, changed IBANs), each a link to where it gets done. The
 * counters come from the same list, so they can't disagree with it.
 */
export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  // The person's name ("Ciao, Marco"), the username only as a fallback.
  const name = user?.firstName || user?.username;
  const greeting = name ? `Ciao, ${name}` : "Home";

  // Setup check: redirect new ADMIN orgs with no business area yet to the onboarding
  // wizard. Registering an organization always creates a Managers record for the admin
  // (see OrganizationService.registerOrganization), so `managers` is never empty for a
  // real org — checking it here as well as businessAreas made the redirect condition
  // practically unreachable. Business areas are the actual gate: without one, Budgets
  // and Contracts can't be created either (see MissingPrerequisiteBanner).
  // Queries are disabled for non-admins; enabled queries share cache with the reference hooks.
  const { data: businessAreas = [], isLoading: loadingAreas, isFetching: fetchingAreas } = useQuery({
    queryKey: referenceQueryKeys.businessAreas,
    queryFn: businessAreasService.list,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const { isLoading: loadingManagers } = useQuery({
    queryKey: referenceQueryKeys.managers,
    queryFn: managersService.list,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    // isFetching too, not only isLoading: right after the setup wizard creates
    // the first area, the cache still holds the old empty list while the fresh
    // one is on its way, and acting on it sent the user back to the wizard.
    if (!isAdmin || loadingAreas || fetchingAreas || loadingManagers) return;
    if (localStorage.getItem(`bcm-setup-skip-${user?.id}`)) return;
    if (businessAreas.length === 0) {
      router.push("/onboarding");
    }
  }, [isAdmin, loadingAreas, fetchingAreas, loadingManagers, businessAreas, router, user?.id]);

  const { data: attention, isLoading, isError } = useHomeAttention();

  // For admin users, keep the skeleton visible until the setup check resolves
  // so there is no flash of content before a potential redirect.
  const isSetupChecking = isAdmin && (loadingAreas || loadingManagers);
  const windowDays = attention?.windowDays ?? 30;

  // Loading, error or the page itself: one of the three, picked before the JSX.
  let body: ReactNode;
  if (isLoading || isSetupChecking) {
    body = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
        <div className="h-48 rounded-lg border border-border bg-card animate-pulse" aria-hidden="true" />
      </>
    );
  } else if (isError || !attention) {
    body = (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Impossibile caricare le attività</p>
        <p className="mt-2 text-sm text-muted-foreground">Ricarica la pagina tra qualche istante</p>
      </div>
    );
  } else {
    body = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title={`Da fare entro ${windowDays} giorni`}
            value={attention.dueSoonCount}
            icon={<CalendarClock className="h-6 w-6" aria-hidden="true" />}
            variant={attention.dueSoonCount > 0 ? "warning" : "default"}
          />
          <KPICard
            title="Fatture da abbinare"
            value={attention.invoicesToMatchCount}
            icon={<FileText className="h-6 w-6" aria-hidden="true" />}
            variant="default"
          />
          <KPICard
            title="Avvisi IBAN"
            value={attention.ibanAlertsCount}
            icon={<Landmark className="h-6 w-6" aria-hidden="true" />}
            variant={attention.ibanAlertsCount > 0 ? "danger" : "default"}
          />
        </div>

        <section aria-labelledby="home-todo" className="space-y-3">
          <h2 id="home-todo" className="text-lg font-semibold text-foreground">Da fare</h2>
          <HomeAttentionList items={attention.items} windowDays={windowDays} />
        </section>

        <SupplierInvoicesSummary invoicesToMatch={attention.invoicesToMatchCount} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{greeting}</h1>
        <p className="text-muted-foreground mt-2">Cosa richiede attenzione nei prossimi {windowDays} giorni</p>
      </div>

      {body}

      {SHOW_ANALYTICS && <AnalyticsSections />}
    </div>
  );
}
