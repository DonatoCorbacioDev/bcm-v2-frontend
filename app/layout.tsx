import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BCM - Business Contracts Manager",
  description:
    "Gestione contratti aziendali con monitoraggio finanziario, scadenze e reportistica.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* The dev console shows a "didn't match" hydration warning on this
            script's nonce attribute — that's expected, not a bug here.
            Browsers clear the nonce attribute from the DOM after reading it
            (so page-inspecting scripts/extensions can't steal and reuse it),
            and React's hydration diff doesn't yet special-case that browser
            behavior for next/script. Our nonce generation (proxy.ts) is
            correct and the script does run. Upstream, unfixed as of this
            writing: https://github.com/vercel/next.js/issues/77952 */}
        <Script src="/theme-init.js" strategy="beforeInteractive" nonce={nonce} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReactQueryProvider>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            duration={3000}
          />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
