import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    "Enterprise contract management system with financial tracking and reporting capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
