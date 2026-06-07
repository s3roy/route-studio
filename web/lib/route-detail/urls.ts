import type { RouteProject, RouteSegment } from "@/lib/analyzer";

/** Query params appended to route detail URLs. */
export type RouteLinkQuery = {
  github?: string | null;
  share?: string | null;
};

function normalizeQuery(githubOrQuery?: string | null | RouteLinkQuery): RouteLinkQuery {
  if (typeof githubOrQuery === "string") return { github: githubOrQuery };
  return githubOrQuery ?? {};
}

/** Map catch-all URL segments to analyzer route id. */
export function routeIdFromSegments(segments?: string[]): string {
  if (!segments || segments.length === 0) return "/";
  return segments.join("/");
}

export function routeDetailHref(
  routeId: string,
  githubOrQuery?: string | null | RouteLinkQuery,
): string {
  const query = normalizeQuery(githubOrQuery);
  const base = routeId === "/" || routeId === "" ? "/studio/route" : `/studio/route/${routeId}`;
  const params = new URLSearchParams();
  if (query.github) params.set("github", query.github);
  if (query.share) params.set("share", query.share);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Breadcrumb labels from public URL path (not internal segment ids). */
export function breadcrumbParts(route: RouteSegment): string[] {
  if (route.urlPath === "/") return ["home"];
  return route.urlPath.replace(/^\//, "").split("/");
}

export type BreadcrumbItem = {
  label: string;
  href: string | null;
};

/** Clickable breadcrumb segments mapped to route detail pages. */
export function breadcrumbItems(
  project: RouteProject,
  route: RouteSegment,
  query?: string | null | RouteLinkQuery,
): BreadcrumbItem[] {
  const linkQuery = normalizeQuery(query);

  if (route.urlPath === "/") {
    return [{ label: "home", href: routeDetailHref("/", linkQuery) }];
  }

  const parts = route.urlPath.replace(/^\//, "").split("/");
  return parts.map((label, index) => {
    const urlPath = `/${parts.slice(0, index + 1).join("/")}`;
    const match = project.routes.find((r) => r.urlPath === urlPath);
    return {
      label,
      href: match ? routeDetailHref(match.id, linkQuery) : null,
    };
  });
}

export function routeLinkQueryFromSearch(params: {
  github?: string | null;
  share?: string | null;
}): RouteLinkQuery {
  return {
    github: params.github ?? null,
    share: params.share ?? null,
  };
}
