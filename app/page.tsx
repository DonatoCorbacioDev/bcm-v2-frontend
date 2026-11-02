/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SHARE_TITLE = "BCM - Business Contracts Manager";
const SHARE_DESCRIPTION =
  "Contratti, scadenze e fatture fornitori in un unico posto. Prova la demo pubblica con dati di esempio.";
// 1200x627 is LinkedIn's recommended share image size (1.91:1).
const SHARE_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 627,
  alt: "Dashboard di BCM con contratti attivi, in scadenza e andamento mensile",
};

// Link previews for the public homepage only; the URLs are made absolute by
// metadataBase in the root layout.
export const metadata: Metadata = {
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    url: "/",
    type: "website",
    siteName: "BCM",
    locale: "it_IT",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
      </main>
      <LandingFooter />
    </div>
  );
}
