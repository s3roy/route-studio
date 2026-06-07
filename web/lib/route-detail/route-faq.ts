import type { RouteSegment } from "@/lib/analyzer";

export type RouteFaqItem = {
  question: string;
  answer: string;
};

export function getRouteFaq(route: RouteSegment): RouteFaqItem[] {
  const dynamicReason =
    route.cacheNotes[0] ??
    (route.rendering === "dynamic" ? "Next.js marked this route as dynamic." : "No dynamic signals detected.");

  const dataCacheAnswer = route.cacheNotes.some((n) => n.includes("no-store"))
    ? `Data Cache is off because the page uses fetch with cache: 'no-store'. That tells Next.js to always hit the origin. ${dynamicReason}`
    : route.cacheNotes.some((n) => n.includes("cookies") || n.includes("headers"))
      ? "cookies() or headers() opt the route out of static caching — every request needs fresh request context."
      : route.rendering === "dynamic"
        ? `This route is dynamic: ${dynamicReason}`
        : "Data Cache should apply to fetch() calls without no-store. Check for other dynamic APIs.";

  const staticAnswer =
    route.rendering === "static"
      ? "This route is already static. Remove unnecessary dynamic APIs to keep it that way."
      : `Remove dynamic signals (${route.cacheNotes.join("; ") || "force-dynamic"}), use cached fetch with next.revalidate, and avoid cookies()/headers() in the page tree.`;

  return [
    {
      question: "Why isn't Data Cache being used?",
      answer: dataCacheAnswer,
    },
    {
      question: "How can I make this route static?",
      answer: staticAnswer,
    },
    {
      question: "What's causing this route to be dynamic?",
      answer:
        route.rendering === "dynamic"
          ? `Detected: ${route.cacheNotes.join(" · ") || "dynamic rendering without explicit static config"}.`
          : "Nothing forced dynamic rendering — Next.js can statically prerender this route at build time.",
    },
  ];
}
