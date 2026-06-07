"use client";

import Link from "next/link";
import { RouteStudioLogo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function HomeHeader() {
  return (
    <header className="theme-border border-b px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="min-w-0 hover:opacity-90">
          <RouteStudioLogo showWordmark subtitle="Next.js App Router visualizer" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link
            href="/studio"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Open demo →
          </Link>
        </div>
      </div>
    </header>
  );
}
