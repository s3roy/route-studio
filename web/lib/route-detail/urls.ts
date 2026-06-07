import type { RouteProject, RouteSegment } from "@/lib/analyzer";

/** Map catch-all URL segments to analyzer route id. */
export function routeIdFromSegments(segments?: string[]): string {
  if (!segments || segments.length === 0) return "/";
  return segments.join("/");
}

export function routeDetailHref(routeId: string, githubUrl?: string | null): string {
  const base = routeId === "/" || routeId === "" ? "/studio/route" : `/studio/route/${routeId}`;
  if (!githubUrl) return base;
  return `${base}?github=${encodeURIComponent(githubUrl)}`;
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
  githubUrl?: string | null,
): BreadcrumbItem[] {
  if (route.urlPath === "/") {
    return [{ label: "home", href: routeDetailHref("/", githubUrl) }];
  }

  const parts = route.urlPath.replace(/^\//, "").split("/");
  return parts.map((label, index) => {
    const urlPath = `/${parts.slice(0, index + 1).join("/")}`;
    const match = project.routes.find((r) => r.urlPath === urlPath);
    return {
      label,
      href: match ? routeDetailHref(match.id, githubUrl) : null,
    };
  });
}
