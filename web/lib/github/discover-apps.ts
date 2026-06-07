import type { ParsedGitHubUrl } from "./parse-url";
import { formatGitHubUrl } from "./parse-url";

const ROUTE_FILE = /\/(page|layout|route|loading)\.(tsx|ts|jsx|js)$/;

/** Repo-relative path to the Next.js project root (folder containing app/ or src/app/). */
export function appRootFromFilePath(filePath: string): string | null {
  const srcMatch = filePath.match(/^(.+)\/src\/app\//);
  if (srcMatch) return srcMatch[1];

  const appMatch = filePath.match(/^(.+)\/app\//);
  if (appMatch) return appMatch[1];

  return null;
}

export function discoverAppRoots(blobPaths: string[]): string[] {
  const roots = new Set<string>();
  for (const filePath of blobPaths) {
    if (!ROUTE_FILE.test(filePath)) continue;
    const root = appRootFromFilePath(filePath);
    if (root) roots.add(root);
  }
  return [...roots];
}

export function rankAppRoots(roots: string[], blobPaths: string[]): string[] {
  return [...roots].sort((a, b) => scoreAppRoot(b, blobPaths) - scoreAppRoot(a, blobPaths));
}

function scoreAppRoot(root: string, blobPaths: string[]): number {
  let score = 0;
  const prefix = `${root}/`;
  for (const p of blobPaths) {
    if (!p.startsWith(prefix)) continue;
    if (p.endsWith("/package.json")) score += 10;
    if (ROUTE_FILE.test(p)) score += 2;
    if (/\/(proxy|middleware)\.(ts|js)$/.test(p)) score += 1;
  }
  if (root.startsWith("examples/")) score += 50;
  if (root.startsWith("apps/")) score += 20;
  if (root.startsWith("packages/")) score += 5;
  if (root.startsWith("test/") || root.includes("/fixtures/")) score -= 100;
  if (root === "test/e2e/app-dir" || root.endsWith("/app-dir")) score -= 150;
  score -= root.split("/").length * 0.1;
  return score;
}

export function buildMonorepoError(
  parsed: ParsedGitHubUrl,
  ref: string,
  blobPaths: string[],
): string {
  const suggestions = buildImportSuggestions(parsed, ref, blobPaths);
  if (suggestions.length === 0) {
    return "No app/ or src/app/ directory found in this repository.";
  }

  const lines = suggestions.map((url) => `• ${url}`);

  return [
    "This looks like a monorepo — there is no app/ folder at the repo root.",
    "Paste a subfolder URL instead, for example:",
    ...lines,
  ].join("\n");
}

export function buildImportSuggestions(
  parsed: ParsedGitHubUrl,
  ref: string,
  blobPaths: string[],
): string[] {
  const all = discoverAppRoots(blobPaths);
  const preferred = all.filter(
    (root) =>
      root.startsWith("examples/") ||
      root.startsWith("apps/") ||
      root.startsWith("packages/") ||
      (!root.startsWith("test/") && !root.includes("/test/")),
  );
  const pool = preferred.length >= 3 ? preferred : all;
  return rankAppRoots(pool, blobPaths)
    .slice(0, 8)
    .map((subpath) => formatGitHubUrl({ ...parsed, subpath, ref: undefined }, ref));
}
