import type { ParsedGitHubUrl } from "./parse-url";
import { formatGitHubUrl } from "./parse-url";

const ROUTE_FILE = /\/(page|layout|route|loading|error|not-found|template|default)\.(tsx|ts|jsx|js)$/;

/** Repo-relative path to the Next.js project root (folder containing app/ or src/app/). */
export function appRootFromFilePath(filePath: string): string | null {
  if (filePath === "app" || filePath.startsWith("app/")) return "";
  if (filePath === "src/app" || filePath.startsWith("src/app/")) return "";

  const srcMatch = filePath.match(/^(.+)\/src\/app(?:\/|$)/);
  if (srcMatch) return srcMatch[1];

  const appMatch = filePath.match(/^(.+)\/app(?:\/|$)/);
  if (appMatch) return appMatch[1];

  return null;
}

export function discoverAppRoots(blobPaths: string[]): string[] {
  const roots = new Set<string>();
  for (const filePath of blobPaths) {
    const root = appRootFromFilePath(filePath);
    if (root == null) continue;

    // Prefer paths that look like real Next apps (route segments or package.json).
    if (
      ROUTE_FILE.test(filePath) ||
      filePath.endsWith("/package.json") ||
      filePath.includes("/app/") ||
      filePath.includes("/src/app/")
    ) {
      roots.add(root);
    }
  }
  return [...roots];
}

export function rankAppRoots(roots: string[], blobPaths: string[]): string[] {
  return [...roots].sort((a, b) => scoreAppRoot(b, blobPaths) - scoreAppRoot(a, blobPaths));
}

function scoreAppRoot(root: string, blobPaths: string[]): number {
  let score = 0;
  const prefix = root ? `${root}/` : "";

  for (const p of blobPaths) {
    if (root && !p.startsWith(prefix)) continue;
    if (!root && !p.startsWith("app/") && !p.startsWith("src/app/")) continue;
    if (p.endsWith("/package.json")) score += 10;
    if (ROUTE_FILE.test(p)) score += 2;
    if (/\/(proxy|middleware)\.(ts|js)$/.test(p)) score += 1;
  }

  if (root.startsWith("examples/")) score += 50;
  if (root.startsWith("apps/")) score += 20;
  if (root.startsWith("packages/")) score += 5;
  if (/^(web|www|site|sites|frontend|starters|demos|samples)\b/.test(root)) score += 15;
  if (root.startsWith("test/") || root.includes("/fixtures/") || root.includes("/e2e/")) score -= 100;
  if (root === "test/e2e/app-dir" || root.endsWith("/app-dir")) score -= 150;
  score -= root.split("/").filter(Boolean).length * 0.1;
  return score;
}

export const MONOREPO_HINT =
  "This looks like a monorepo — there is no app/ folder at the repo root. Pick a subfolder below or paste its /tree/… URL.";

export const TRUNCATED_REPO_HINT =
  "This repository is very large. Pick a subfolder below or paste a /tree/… URL pointing at a single Next.js app.";

export function buildMonorepoError(
  _parsed: ParsedGitHubUrl,
  _ref: string,
  blobPaths: string[],
  remoteRoots: string[] = [],
): string {
  const suggestions = buildImportSuggestions(_parsed, _ref, blobPaths, remoteRoots);
  if (suggestions.length === 0) {
    return "No app/ or src/app/ directory found in this repository.";
  }

  return MONOREPO_HINT;
}

export function buildTruncatedRepoError(
  parsed: ParsedGitHubUrl,
  ref: string,
  blobPaths: string[],
  remoteRoots: string[] = [],
): string {
  const suggestions = buildImportSuggestions(parsed, ref, blobPaths, remoteRoots);
  if (suggestions.length === 0) {
    return TRUNCATED_REPO_HINT;
  }
  return TRUNCATED_REPO_HINT;
}

export function buildImportSuggestions(
  parsed: ParsedGitHubUrl,
  ref: string,
  blobPaths: string[],
  remoteRoots: string[] = [],
): string[] {
  const fromTree = discoverAppRoots(blobPaths);
  const all = [...new Set([...fromTree, ...remoteRoots])];

  if (all.length === 0) return [];

  const preferred = all.filter(
    (root) =>
      root.startsWith("examples/") ||
      root.startsWith("apps/") ||
      root.startsWith("packages/") ||
      /^(web|www|site|sites|frontend|starters|demos|samples)(\/|$)/.test(root) ||
      (!root.startsWith("test/") && !root.includes("/test/") && !root.includes("/e2e/")),
  );
  const pool = preferred.length >= 3 ? preferred : all;

  return rankAppRoots(pool, blobPaths)
    .slice(0, 10)
    .map((subpath) => formatGitHubUrl({ ...parsed, subpath, ref: undefined }, ref));
}

export function mergeDiscoveredRoots(blobPaths: string[], remoteRoots: string[]): string[] {
  return rankAppRoots([...new Set([...discoverAppRoots(blobPaths), ...remoteRoots])], blobPaths);
}
