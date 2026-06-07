import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Route Studio — Next.js App Router visualizer",
  description:
    "Scan app/, explore an interactive route graph, and understand RSC rendering and cache behavior per route.",
  openGraph: {
    title: "Route Studio",
    description: "Interactive Next.js App Router explorer with cache-layer insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full text-[13px] antialiased">{children}</body>
    </html>
  );
}
