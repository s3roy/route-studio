"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RouteProject, RouteSegment } from "@/lib/analyzer";
import type { CacheLayer } from "@/lib/route-detail/cache-layers";
import type { SuggestedFetch } from "@/lib/route-detail/suggested-fetch";
import type { RouteFaqItem } from "@/lib/route-detail/route-faq";
import { copyShareUrl, createShareLink, routeShareHref } from "@/lib/share/build-share-url";
import { routeLinkQueryFromSearch } from "@/lib/route-detail/urls";
import { RouteStudioMark, ShareIcon } from "@/components/icons";
import { StudioNav } from "@/components/layout/studio-nav";
import { breadcrumbItems, routeDetailHref } from "@/lib/route-detail/urls";
import { DEMO_ROUTES } from "@/lib/demo-routes";
import { isDemoProject } from "@/lib/route-detail/project-source-label";
import { saveStudioSession } from "@/lib/studio-session";
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
  shareId?: string | null;
};

export function RouteDetailShell({
  project,
  route,
  layers,
  layoutChain,
  suggestion,
  faq,
  githubUrl = null,
  shareId = null,
}: RouteDetailShellProps) {
  const [copied, setCopied] = useState(false);
  const linkQuery = routeLinkQueryFromSearch({ github: githubUrl, share: shareId });
  const crumbs = breadcrumbItems(project, route, linkQuery);
  const pageFile = route.files.find((f) => f.kind === "page")?.path;
  const demoProject = isDemoProject(project);
  const footerRoutes = demoProject
    ? DEMO_ROUTES.map((r) => ({ id: r.id, urlPath: r.urlPath }))
    : project.routes.slice(0, 10).map((r) => ({ id: r.id, urlPath: r.urlPath }));

  useEffect(() => {
    const selectedPath = pageFile ?? route.files[0]?.path ?? null;
    if (githubUrl) {
      saveStudioSession({
        source: { type: "github", url: githubUrl },
        selectedPath,
        project,
      });
      return;
    }
    if (shareId) {
      saveStudioSession({
        source: { type: "share", shareId },
        selectedPath,
        project,
      });
    }
  }, [githubUrl, shareId, project, route, pageFile]);

  async function shareLink() {
    const result = await createShareLink({ project, routeId: route.id });
    if (!result.ok) return;
    const href = routeShareHref(route.id, result.shareId, linkQuery);
    await copyShareUrl(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="app-shell theme-shell flex flex-col overflow-hidden">
      <header className="theme-border flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/studio" className="theme-muted hidden items-center gap-1.5 text-xs hover:theme-text sm:inline-flex">
            <RouteStudioMark size={14} className="text-violet-600" />
            <span>Route Studio</span>
          </Link>
          <span className="theme-muted-subtle hidden sm:inline">/</span>
          <nav className="flex min-w-0 items-center gap-1 text-sm">
            {crumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
                {i > 0 ? <span className="theme-muted-subtle">/</span> : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={
                      i === crumbs.length - 1
                        ? "theme-text truncate font-medium hover:text-violet-700"
                        : "theme-muted truncate hover:theme-text-secondary"
                    }
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      i === crumbs.length - 1
                        ? "theme-text truncate font-medium"
                        : "theme-muted truncate"
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void shareLink()}
            className="theme-border theme-hover theme-text-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
          >
            <ShareIcon size={15} />
            {copied ? "Link copied" : "Share"}
          </button>
          {pageFile ? (
            <span
              className="theme-border theme-muted hidden rounded-lg border px-3 py-2 text-sm sm:inline"
              title={pageFile}
            >
              Edit route
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <StudioNav nextVersion={project.nextVersion} />

        <aside className="theme-panel flex w-[280px] shrink-0 flex-col overflow-hidden border-r theme-border">
          <RouteMetadataPanel project={project} route={route} layers={layers} />
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
          <RequestFlowDiagram project={project} route={route} layoutChain={layoutChain} />

          <div className="grid gap-5 xl:grid-cols-2">
            <SuggestedFetchPanel suggestion={suggestion} />
            <RouteFaqPanel route={route} layers={layers} items={faq} />
          </div>

          <div className="theme-muted-subtle flex flex-wrap items-center gap-2 pb-2 text-[11px]">
            <Link href="/studio" className="text-violet-600 hover:text-violet-700">
              ← Dashboard
            </Link>
            <span>·</span>
            <span>{demoProject ? "Demo routes:" : "Project routes:"}</span>
            {footerRoutes.map((r) => (
              <Link
                key={r.id}
                href={routeDetailHref(r.id, linkQuery)}
                className={`rounded-md border px-2.5 py-1.5 text-xs ${
                  r.id === route.id
                    ? "theme-selected border-violet-500/35 font-medium"
                    : "theme-border theme-muted theme-hover"
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
