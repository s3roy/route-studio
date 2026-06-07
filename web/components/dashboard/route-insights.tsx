import Link from "next/link";
import type { RouteProject, RouteSegment } from "@/lib/analyzer";
import { routeDetailHref } from "@/lib/route-detail/urls";

type RouteInsightsProps = {
  project: RouteProject;
  selectedPath: string | null;
  githubUrl?: string | null;
};

/** Mockup 01 — quick insight cards (header row + status circle body). */
export function RouteInsights({ project, selectedPath, githubUrl }: RouteInsightsProps) {
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
      }
    : route?.isRSC
      ? {
          title: "React Server Component",
          body: "This route is rendered on the server using React Server Components.",
          badge: "RSC",
          tone: "emerald" as const,
        }
      : {
          title: "Server",
          body: "Rendered on the server for this segment.",
          badge: "S",
          tone: "zinc" as const,
        };

  const cache = route ? describeCache(route) : null;
  const dataCacheMiss = route?.cacheNotes.some((n) => n.includes("no-store") || n.includes("dynamic"));
  const dataCacheHit = route?.rendering === "static" && !dataCacheMiss;

  return (
    <div className="flex h-full min-h-0 flex-col text-[13px] leading-snug">
      <div className="shrink-0 border-b border-white/10 px-3.5 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Route insights
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {!selectedPath ? (
          <EmptyState title="Select a route" body="Click a file or graph node." />
        ) : loadingOnly ? (
          <>
            <InsightCard
              headerIcon="◌"
              label="Rendering"
              title="Loading UI"
              body="Shown while the page segment is loading."
              badge="◌"
              tone="zinc"
            />
            <InsightCard
              headerIcon="◧"
              label="File"
              title={shortPath(selectedPath)}
              body="Suspense fallback for this route segment."
              badge="◧"
              tone="zinc"
              mono
            />
          </>
        ) : !route ? (
          selectedPath.endsWith("layout.tsx") ? (
            <InsightCard
              headerIcon="◫"
              label="Rendering"
              title="React Server Component"
              body="Shared layout shell for nested routes."
              badge="RSC"
              tone="emerald"
            />
          ) : (
            <EmptyState title="No route metadata" body="Not a page or API route." />
          )
        ) : (
          <>
            <InsightCard
              headerIcon="◫"
              label="Rendering"
              title={rendering.title}
              body={rendering.body}
              badge={rendering.badge}
              tone={rendering.tone}
            />
            <InsightCard
              headerIcon="⏱"
              label="Cache strategy"
              title={cache?.title ?? "Unknown"}
              body={cache?.body ?? "No cache signals detected in this segment."}
              badge="⏱"
              tone="sky"
            />
            <InsightCard
              headerIcon="◉"
              label="Data cache"
              title={dataCacheMiss ? "Miss" : dataCacheHit ? "Hit" : "—"}
              body={
                dataCacheMiss
                  ? "Data for this route is not cached in the Next.js Data Cache."
                  : dataCacheHit
                    ? "Static output can be served from cache."
                    : "Cache behavior depends on runtime signals."
              }
              badge={dataCacheMiss ? "✕" : dataCacheHit ? "✓" : "○"}
              tone={dataCacheMiss ? "rose" : dataCacheHit ? "emerald" : "zinc"}
            />
          </>
        )}

        <LearnMoreCard />
      </div>

      {route ? (
        <div className="shrink-0 border-t border-white/10 p-3">
          <Link
            href={routeDetailHref(route.id, githubUrl)}
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
  tone,
  mono,
}: {
  headerIcon: string;
  label: string;
  title: string;
  body: string;
  badge: string;
  tone: "emerald" | "sky" | "rose" | "violet" | "zinc";
  mono?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#121214]">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <span className="text-xs text-zinc-500">{headerIcon}</span>
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      </div>
      <div className="flex gap-3 px-3 py-2.5">
        <StatusCircle tone={tone}>{badge}</StatusCircle>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold leading-snug text-zinc-100 ${mono ? "truncate font-mono" : ""}`}>
            {title}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{body}</p>
        </div>
      </div>
    </article>
  );
}

function LearnMoreCard() {
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#121214]">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <span className="text-xs text-zinc-500">📖</span>
        <p className="text-[11px] font-medium text-zinc-500">Learn more</p>
      </div>
      <div className="px-3 py-2.5">
        <a
          href="https://nextjs.org/docs/app"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-violet-400 hover:text-violet-300"
        >
          View Next.js docs ↗
        </a>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
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
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    sky: "border-sky-500/40 bg-sky-500/10 text-sky-400",
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-400",
    violet: "border-violet-500/40 bg-violet-500/10 text-violet-400",
    zinc: "border-zinc-600/50 bg-zinc-800/80 text-zinc-400",
  }[tone];

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${styles}`}
    >
      {children}
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 px-3 py-2.5 text-zinc-500">
      <p className="text-xs font-medium text-zinc-400">{title}</p>
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
