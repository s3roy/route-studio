import type { RouteSegment } from "@/lib/analyzer";

export type CacheLayerStatus = "active" | "inactive" | "partial";

export type CacheLayer = {
  id: string;
  name: string;
  status: CacheLayerStatus;
  description: string;
  note?: string;
};

export function getCacheLayers(route: RouteSegment): CacheLayer[] {
  const noStore = route.cacheNotes.some((n) => n.includes("no-store"));
  const forceDynamic = route.cacheNotes.some((n) => n.includes("force-dynamic"));
  const dynamicSignals = route.cacheNotes.some(
    (n) =>
      n.includes("cookies") ||
      n.includes("headers") ||
      n.includes("force-no-store") ||
      n.includes("revalidate = false"),
  );
  const isDynamic = route.rendering === "dynamic";
  const dataCacheInactive = noStore || forceDynamic || dynamicSignals || isDynamic;

  return [
    {
      id: "request-memo",
      name: "Request memoization",
      status: "active",
      description: "Dedupes identical fetch() calls during one server render.",
    },
    {
      id: "data-cache",
      name: "Data Cache",
      status: dataCacheInactive ? "inactive" : "active",
      description: dataCacheInactive
        ? "Not used — no-store, dynamic APIs, or per-request data detected."
        : "fetch() responses can be cached and reused across requests.",
      note: dataCacheInactive
        ? route.cacheNotes.find((n) => n.includes("no-store")) ??
          (isDynamic ? "Route renders dynamically — Data Cache skipped." : undefined)
        : undefined,
    },
    {
      id: "full-route",
      name: "Full Route Cache",
      status: isDynamic ? "inactive" : "active",
      description: isDynamic
        ? "HTML + RSC payload rebuilt on each request."
        : "Static HTML and RSC payload can be cached at build time.",
    },
    {
      id: "router",
      name: "Router cache",
      status: isDynamic ? "partial" : "active",
      description: isDynamic
        ? "Limited client cache — dynamic routes refetch on navigation."
        : "Prefetched RSC payloads reused during client navigations.",
    },
  ];
}
