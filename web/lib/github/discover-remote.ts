import type { ParsedGitHubUrl } from "./parse-url";
import { discoverAppRoots, rankAppRoots } from "./discover-apps";

/** Top-level folders commonly used in JS monorepos. */
const MONOREPO_SCAN_DIRS = [
  "apps",
  "examples",
  "packages",
  "sites",
  "site",
  "web",
  "www",
  "frontend",
  "services",
  "starters",
  "playground",
  "demos",
  "samples",
] as const;

const MAX_DIR_LISTINGS = 80;
const MAX_WALK_DEPTH = 5;

type DirEntry = { name: string; type: string; sha: string };

export async function listDirectoryContents(
  owner: string,
  repo: string,
  ref: string,
  dirPath: string,
  headers: Record<string, string>,
): Promise<DirEntry[]> {
  const encodedRef = encodeURIComponent(ref);
  const url = dirPath
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${encodedRef}`
    : `https://api.github.com/repos/${owner}/${repo}/contents?ref=${encodedRef}`;

  const res = await fetch(url, { headers });
  if (!res.ok) return [];

  const data = (await res.json()) as DirEntry | DirEntry[];
  if (Array.isArray(data)) return data;
  return data.type === "dir" ? [data] : [];
}

export async function subpathHasNextApp(
  owner: string,
  repo: string,
  ref: string,
  subpath: string,
  headers: Record<string, string>,
): Promise<boolean> {
  const entries = await listDirectoryContents(owner, repo, ref, subpath, headers);
  if (entries.some((e) => e.name === "app" && e.type === "dir")) return true;

  const src = entries.find((e) => e.name === "src" && e.type === "dir");
  if (!src) return false;

  const srcEntries = await listDirectoryContents(owner, repo, ref, `${subpath}/src`, headers);
  return srcEntries.some((e) => e.name === "app" && e.type === "dir");
}

async function walkForApps(
  owner: string,
  repo: string,
  ref: string,
  subpath: string,
  depth: number,
  headers: Record<string, string>,
  state: { listings: number },
): Promise<string[]> {
  if (state.listings >= MAX_DIR_LISTINGS) return [];

  if (await subpathHasNextApp(owner, repo, ref, subpath, headers)) {
    return [subpath];
  }

  if (depth >= MAX_WALK_DEPTH) return [];

  state.listings += 1;
  const children = await listDirectoryContents(owner, repo, ref, subpath, headers);
  const dirs = children.filter((e) => e.type === "dir");

  const found: string[] = [];
  for (const child of dirs) {
    if (state.listings >= MAX_DIR_LISTINGS) break;
    const childPath = `${subpath}/${child.name}`;
    found.push(...(await walkForApps(owner, repo, ref, childPath, depth + 1, headers, state)));
  }
  return found;
}

/** Walk common monorepo folders when the full git tree is unavailable or incomplete. */
export async function shallowDiscoverAppRoots(
  parsed: ParsedGitHubUrl,
  ref: string,
  headers: Record<string, string>,
): Promise<string[]> {
  const { owner, repo } = parsed;
  const topLevel = await listDirectoryContents(owner, repo, ref, "", headers);
  const roots = new Set<string>();
  const state = { listings: 0 };

  for (const scanDir of MONOREPO_SCAN_DIRS) {
    const entry = topLevel.find((e) => e.name === scanDir && e.type === "dir");
    if (!entry) continue;

    for (const subpath of await walkForApps(owner, repo, ref, scanDir, 0, headers, state)) {
      roots.add(subpath);
    }
  }

  return [...roots];
}

/** Use GitHub code search to find page.tsx / layout.tsx under app/ directories. */
export async function searchDiscoverAppRoots(
  parsed: ParsedGitHubUrl,
  headers: Record<string, string>,
): Promise<string[]> {
  const repo = `${parsed.owner}/${parsed.repo}`;
  const queries = [
    `repo:${repo} filename:page.tsx path:app`,
    `repo:${repo} filename:page.jsx path:app`,
    `repo:${repo} filename:layout.tsx path:app`,
    `repo:${repo} filename:page.tsx path:src/app`,
  ];

  const paths = new Set<string>();
  for (const q of queries) {
    const res = await fetch(
      `https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=100`,
      { headers },
    );
    if (!res.ok) continue;

    const data = (await res.json()) as { items?: { path: string }[] };
    for (const item of data.items ?? []) {
      paths.add(item.path);
    }
  }

  return discoverAppRoots([...paths]);
}

export async function discoverAppRootsRemote(
  parsed: ParsedGitHubUrl,
  ref: string,
  headers: Record<string, string>,
  blobPaths: string[] = [],
): Promise<string[]> {
  const [searchRoots, shallowRoots] = await Promise.all([
    searchDiscoverAppRoots(parsed, headers).catch(() => [] as string[]),
    shallowDiscoverAppRoots(parsed, ref, headers).catch(() => [] as string[]),
  ]);

  const merged = [...new Set([...searchRoots, ...shallowRoots])];
  return rankAppRoots(merged, blobPaths);
}
