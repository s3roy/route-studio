import type { RouteLinkQuery } from "@/lib/route-detail/urls";
import { routeDetailHref } from "@/lib/route-detail/urls";

export async function createShareLink(payload: {
  project: unknown;
  routeId?: string;
  selectedPath?: string | null;
}): Promise<{ ok: true; shareId: string } | { ok: false; error: string }> {
  const res = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as
    | { ok: true; shareId: string }
    | { ok: false; error: string };
  return data;
}

export function studioShareHref(shareId: string): string {
  return `/studio?share=${encodeURIComponent(shareId)}`;
}

export function routeShareHref(routeId: string, shareId: string, query?: RouteLinkQuery): string {
  return routeDetailHref(routeId, { ...query, share: shareId });
}

export async function copyShareUrl(url: string): Promise<void> {
  const absolute =
    typeof window !== "undefined" && url.startsWith("/")
      ? `${window.location.origin}${url}`
      : url;
  await navigator.clipboard.writeText(absolute);
}
