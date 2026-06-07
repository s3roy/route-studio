import type { RouteProject, RouteSegment } from "@/lib/analyzer";
import { readPageSource } from "./read-page-source";

export type SuggestedFetch = {
  code: string;
  reason: string;
};

export async function suggestFetch(
  project: RouteProject,
  route: RouteSegment,
): Promise<SuggestedFetch | null> {
  const source = await readPageSource(project, route);
  if (!source) return null;

  const fetchMatch = source.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
  if (!fetchMatch) return null;

  const url = fetchMatch[1];
  const tag = route.urlPath.replace(/^\//, "").replace(/\//g, "-") || "root";
  const hasNoStore = /cache\s*:\s*['"]no-store['"]/.test(source);

  if (!hasNoStore && route.rendering === "static") {
    return null;
  }

  const code = `const res = await fetch('${url}', {
  next: {
    revalidate: 60,
    tags: ['${tag}'],
  },
  headers: {
    Authorization: \`Bearer \${token}\`,
  },
  credentials: 'include',
});

if (!res.ok) {
  throw new Error('Failed to load settings');
}

return res.json();`;

  return {
    code,
    reason: hasNoStore
      ? "Replace cache: 'no-store' with next.revalidate to opt into the Data Cache."
      : "Add next.revalidate and tags so fetch results persist across requests.",
  };
}
