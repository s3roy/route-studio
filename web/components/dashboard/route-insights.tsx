import Link from "next/link";
import type { ReactNode } from "react";
import type { RouteProject, RouteSegment } from "@/lib/analyzer";
import {
  BookIcon,
  CheckCircleIcon,
  ClockIcon,
  ComponentIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  LayoutIcon,
  LoadingIcon,
  PageIcon,
  XCircleIcon,
} from "@/components/icons";
import { routeDetailHref } from "@/lib/route-detail/urls";

type RouteInsightsProps = {
  project: RouteProject;
  selectedPath: string | null;
  linkQuery?: { github?: string | null; share?: string | null };
};

/** Mockup 01 — quick insight cards (header row + status circle body). */
export function RouteInsights({ project, selectedPath, linkQuery }: RouteInsightsProps) {
  const route = findRouteForPath(project, selectedPath);
  const file = route?.files.find((f) => f.path === selectedPath);
  const loadingOnly =
    selectedPath?.endsWith("loading.tsx") &&
    !route?.files.some((f) => f.path === selectedPath && (f.kind === "page" || f.kind === "route"));

  const rendering = file?.isClientComponent
    ? {
        title: "Client Component",
        body: "Runs in the browser with client-side interactivity.",
        badge: "◧",
        tone: "violet" as const,
        badgeIcon: <PageIcon size={14} />,
      }
    : route?.isRSC
      ? {
          title: "React Server Component",
          body: "This route is rendered on the server using React Server Components.",
          badge: "RSC",
          tone: "emerald" as const,
          badgeIcon: <ComponentIcon size={14} />,
        }
      : {
          title: "Server",
          body: "Rendered on the server for this segment.",
          badge: "S",
          tone: "zinc" as const,
          badgeIcon: <ComponentIcon size={14} />,
        };

  const cache = route ? describeCache(route) : null;
  const dataCacheMiss = route?.cacheNotes.some((n) => n.includes("no-store") || n.includes("dynamic"));
  const dataCacheHit = route?.rendering === "static" && !dataCacheMiss;

  return (
    <div className="flex h-full min-h-0 flex-col text-[13px] leading-snug">
      <div className="theme-border shrink-0 border-b px-3.5 py-2.5">
        <p className="theme-muted text-[11px] font-semibold uppercase tracking-wider">
          Route insights
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {!selectedPath ? (
          <EmptyState title="Select a route" body="Click a file or graph node." />
        ) : loadingOnly ? (
          <>
            <InsightCard
              headerIcon={<LoadingIcon size={13} />}
              label="Rendering"
              title="Loading UI"
              body="Shown while the page segment is loading."
              badgeIcon={<LoadingIcon size={14} />}
              tone="zinc"
            />
            <InsightCard
              headerIcon={<PageIcon size={13} />}
              label="File"
              title={shortPath(selectedPath)}
              body="Suspense fallback for this route segment."
              badgeIcon={<PageIcon size={14} />}
              tone="zinc"
              mono
            />
          </>
        ) : !route ? (
          selectedPath.endsWith("layout.tsx") ? (
            <InsightCard
              headerIcon={<LayoutIcon size={13} />}
              label="Rendering"
              title="React Server Component"
              body="Shared layout shell for nested routes."
              badge="RSC"
              badgeIcon={<ComponentIcon size={14} />}
              tone="emerald"
            />
          ) : (
            <EmptyState title="No route metadata" body="Not a page or API route." />
          )
        ) : (
          <>
            <InsightCard
              headerIcon={<ComponentIcon size={13} />}
              label="Rendering"
              title={rendering.title}
              body={rendering.body}
              badge={rendering.badge}
              badgeIcon={rendering.badgeIcon}
              tone={rendering.tone}
            />
            <InsightCard
              headerIcon={<ClockIcon size={13} />}
              label="Cache strategy"
              title={cache?.title ?? "Unknown"}
              body={cache?.body ?? "No cache signals detected in this segment."}
              badgeIcon={<ClockIcon size={14} />}
              tone="sky"
            />
            <InsightCard
              headerIcon={<DatabaseIcon size={13} />}
              label="Data cache"
              title={dataCacheMiss ? "Miss" : dataCacheHit ? "Hit" : "—"}
              body={
                dataCacheMiss
                  ? "Data for this route is not cached in the Next.js Data Cache."
                  : dataCacheHit
                    ? "Static output can be served from cache."
                    : "Cache behavior depends on runtime signals."
              }
              badgeIcon={
                dataCacheMiss ? (
                  <XCircleIcon size={14} />
                ) : dataCacheHit ? (
                  <CheckCircleIcon size={14} />
                ) : (
                  "○"
                )
              }
              tone={dataCacheMiss ? "rose" : dataCacheHit ? "emerald" : "zinc"}
            />
          </>
        )}

        <LearnMoreCard />
      </div>

      {route ? (
        <div className="theme-border shrink-0 border-t p-3">
          <Link
            href={routeDetailHref(route.id, linkQuery)}
            className="block rounded-md bg-violet-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-violet-500"
          >
            Open route detail →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function InsightCard({
  headerIcon,
  label,
  title,
  body,
  badge,
  badgeIcon,
  tone,
  mono,
}: {
  headerIcon: ReactNode;
  label: string;
  title: string;
  body: string;
  badge?: string;
  badgeIcon?: ReactNode;
  tone: "emerald" | "sky" | "rose" | "violet" | "zinc";
  mono?: boolean;
}) {
  return (
    <article className="theme-card theme-border overflow-hidden rounded-lg border">
      <div className="theme-border-subtle flex items-center gap-2 border-b px-3 py-2">
        <span className="theme-muted flex h-4 w-4 shrink-0 items-center justify-center">
          {headerIcon}
        </span>
        <p className="theme-muted text-[11px] font-medium leading-none">{label}</p>
      </div>
      <div className="flex gap-3 px-3 py-2.5">
        <StatusCircle tone={tone}>{badgeIcon ?? badge}</StatusCircle>
        <div className="min-w-0 flex-1">
          <p className={`theme-text text-xs font-semibold leading-snug ${mono ? "truncate font-mono" : ""}`}>
            {title}
          </p>
          <p className="theme-muted mt-1 text-[11px] leading-relaxed">{body}</p>
        </div>
      </div>
    </article>
  );
}

function LearnMoreCard() {
  return (
    <article className="theme-card theme-border overflow-hidden rounded-lg border">
      <div className="theme-border-subtle flex items-center gap-2 border-b px-3 py-2">
        <BookIcon size={13} className="theme-muted" />
        <p className="theme-muted text-[11px] font-medium">Learn more</p>
      </div>
      <div className="px-3 py-2.5">
        <a
          href="https://nextjs.org/docs/app"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-violet-500 hover:text-violet-600"
        >
          View Next.js docs
          <ExternalLinkIcon size={12} />
        </a>
        <p className="theme-muted mt-1.5 text-[11px] leading-relaxed">
          Explore the official Next.js documentation to learn more about App Router.
        </p>
      </div>
    </article>
  );
}

function StatusCircle({
  tone,
  children,
}: {
  tone: "emerald" | "sky" | "rose" | "violet" | "zinc";
  children: React.ReactNode;
}) {
  const styles = {
    emerald: "status-badge status-badge-emerald",
    sky: "status-badge status-badge-sky",
    rose: "status-badge status-badge-rose",
    violet: "status-badge status-badge-violet",
    zinc: "status-badge status-badge-zinc",
  }[tone];

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] ${styles}`}
    >
      {children}
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="theme-border rounded-lg border border-dashed px-3 py-2.5 theme-muted">
      <p className="theme-text-secondary text-xs font-medium">{title}</p>
      <p className="mt-1 text-[11px]">{body}</p>
    </div>
  );
}

function findRouteForPath(project: RouteProject, path: string | null): RouteSegment | undefined {
  if (!path) return undefined;
  return project.routes.find((r) => r.files.some((f) => f.path === path));
}

function describeCache(route: RouteSegment): { title: string; body: string } {
  if (route.cacheNotes.some((n) => n.includes("no-store"))) {
    return {
      title: "Dynamic · fetch no-store",
      body: "This route uses dynamic rendering and fetch with no-store.",
    };
  }
  if (route.rendering === "dynamic") {
    return {
      title: "Dynamic · per request",
      body: "Rendered fresh on each request.",
    };
  }
  if (route.rendering === "static") {
    return {
      title: "Static · prerendered",
      body: "Output can be generated at build time.",
    };
  }
  return { title: "Unknown", body: "No explicit cache config found." };
}

function shortPath(path: string): string {
  return path.replace(/^app\//, "");
}
