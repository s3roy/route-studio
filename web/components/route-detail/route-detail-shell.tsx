"use client";

import Link from "next/link";
import { useState } from "react";
import type { RouteProject, RouteSegment } from "@/lib/analyzer";
import type { CacheLayer } from "@/lib/route-detail/cache-layers";
import type { SuggestedFetch } from "@/lib/route-detail/suggested-fetch";
import type { RouteFaqItem } from "@/lib/route-detail/route-faq";
import { StudioNav } from "@/components/layout/studio-nav";
import { breadcrumbItems, routeDetailHref } from "@/lib/route-detail/urls";
import { DEMO_ROUTES } from "@/lib/demo-routes";
import { RouteMetadataPanel } from "./route-metadata-panel";
import { RequestFlowDiagram } from "./request-flow-diagram";
import { SuggestedFetchPanel } from "./suggested-fetch-panel";
import { RouteFaqPanel } from "./route-faq-panel";

type RouteDetailShellProps = {
  project: RouteProject;
  route: RouteSegment;
  layers: CacheLayer[];
  layoutChain: string[];
  suggestion: SuggestedFetch | null;
  faq: RouteFaqItem[];
  githubUrl?: string | null;
};

export function RouteDetailShell({
  project,
  route,
  layers,
  layoutChain,
  suggestion,
  faq,
  githubUrl = null,
}: RouteDetailShellProps) {
  const [copied, setCopied] = useState(false);
  const crumbs = breadcrumbItems(project, route, githubUrl);
  const pageFile = route.files.find((f) => f.kind === "page")?.path;

  async function shareLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="app-shell flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/studio" className="hidden text-xs text-zinc-500 hover:text-zinc-300 sm:inline">
            Route Studio
          </Link>
          <span className="hidden text-zinc-700 sm:inline">/</span>
          <nav className="flex min-w-0 items-center gap-1 text-sm">
            {crumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
                {i > 0 ? <span className="text-zinc-600">/</span> : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={
                      i === crumbs.length - 1
                        ? "truncate font-medium text-zinc-100 hover:text-violet-200"
                        : "truncate text-zinc-500 hover:text-zinc-300"
                    }
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      i === crumbs.length - 1
                        ? "truncate font-medium text-zinc-100"
                        : "truncate text-zinc-500"
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
          <span className="hidden truncate font-mono text-xs text-zinc-600 lg:inline">
            {route.urlPath}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={shareLink}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            {copied ? "Link copied" : "Share"}
          </button>
          {pageFile ? (
            <span
              className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-400 sm:inline"
              title={pageFile}
            >
              Edit route
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <StudioNav />

        <aside className="flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-zinc-950">
          <RouteMetadataPanel route={route} layers={layers} />
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
          <RequestFlowDiagram project={project} route={route} layoutChain={layoutChain} />

          <div className="grid gap-5 xl:grid-cols-2">
            <SuggestedFetchPanel suggestion={suggestion} />
            <RouteFaqPanel items={faq} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-2 text-[11px] text-zinc-600">
            <Link href="/studio" className="text-violet-400 hover:text-violet-300">
              ← Dashboard
            </Link>
            <span>·</span>
            <span>Demo routes:</span>
            {DEMO_ROUTES.map((r) => (
              <Link
                key={r.id}
                href={routeDetailHref(r.id, githubUrl)}
                className={`rounded-md border px-2.5 py-1.5 text-xs ${
                  r.id === route.id
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                    : "border-white/10 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r.urlPath}
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
