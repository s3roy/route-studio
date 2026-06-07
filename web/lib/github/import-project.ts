import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanProject, type RouteProject } from "@/lib/analyzer";
import {
  buildImportSuggestions,
  buildMonorepoError,
  buildTruncatedRepoError,
  mergeDiscoveredRoots,
} from "./discover-apps";
import { discoverAppRootsRemote } from "./discover-remote";
import { formatGitHubUrl, parseGitHubUrl, type ParsedGitHubUrl } from "./parse-url";

const MAX_FILES = 400;
const MAX_FILE_BYTES = 512_000;
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { project: RouteProject; expires: number };
type TreeBlob = { path: string; size: number };
type RepoTree = { blobs: TreeBlob[]; truncated: boolean };

const projectCache = new Map<string, CacheEntry>();

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Route-Studio",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function cacheKey(parsed: ParsedGitHubUrl, ref: string): string {
  return `${parsed.owner}/${parsed.repo}@${ref}:${parsed.subpath ?? ""}`;
}

async function resolveRef(parsed: ParsedGitHubUrl): Promise<string> {
  if (parsed.ref) return parsed.ref;

  const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: ghHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Repository not found — check the URL or repo visibility.");
    if (res.status === 403) throw new Error("GitHub rate limit hit. Try again later or set GITHUB_TOKEN.");
    throw new Error(`GitHub API error (${res.status}).`);
  }

  const data = (await res.json()) as { default_branch: string };
  return data.default_branch;
}

function stripSubpath(filePath: string, subpath: string): string | null {
  const normalized = subpath.replace(/\/$/, "");
  if (filePath === normalized) return "";
  const prefix = `${normalized}/`;
  if (!filePath.startsWith(prefix)) return null;
  return filePath.slice(prefix.length);
}

function shouldIncludeFile(filePath: string, subpath?: string): boolean {
  const rel = subpath ? stripSubpath(filePath, subpath) : filePath;
  if (rel == null || rel.includes("..")) return false;

  if (rel === "package.json") return true;
  if (/^(src\/)?(proxy|middleware)\.(ts|js)$/.test(rel)) return true;
  if (rel.startsWith("app/") || rel.startsWith("src/app/")) return true;

  return false;
}

async function fetchRepoTree(parsed: ParsedGitHubUrl, ref: string): Promise<RepoTree> {
  const res = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    { headers: ghHeaders() },
  );

  if (!res.ok) {
    if (res.status === 404) throw new Error(`Branch "${ref}" not found.`);
    throw new Error(`Failed to read repo tree (${res.status}).`);
  }

  const data = (await res.json()) as {
    truncated?: boolean;
    tree: { path: string; type: string; size?: number }[];
  };

  return {
    truncated: Boolean(data.truncated),
    blobs: data.tree
      .filter((entry) => entry.type === "blob")
      .map((entry) => ({ path: entry.path, size: entry.size ?? 0 })),
  };
}

/** Fetch a complete file list for one monorepo subfolder (works when the root tree is truncated). */
async function fetchSubpathTree(
  parsed: ParsedGitHubUrl,
  ref: string,
  subpath: string,
): Promise<TreeBlob[]> {
  const headers = ghHeaders();
  const normalized = subpath.replace(/\/$/, "");
  const treeSha = await resolveDirectoryTreeSha(parsed, ref, normalized, headers);

  const treeRes = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${treeSha}?recursive=1`,
    { headers },
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to read files under "${normalized}" (${treeRes.status}).`);
  }

  const data = (await treeRes.json()) as {
    truncated?: boolean;
    tree: { path: string; type: string; size?: number }[];
  };

  if (data.truncated) {
    throw new Error(
      `Subfolder "${normalized}" is too large to scan. Try a smaller example app within the monorepo.`,
    );
  }

  return data.tree
    .filter((item) => item.type === "blob")
    .map((item) => ({
      path: `${normalized}/${item.path}`,
      size: item.size ?? 0,
    }));
}

async function resolveDirectoryTreeSha(
  parsed: ParsedGitHubUrl,
  ref: string,
  subpath: string,
  headers: Record<string, string>,
): Promise<string> {
  const commitRes = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${encodeURIComponent(ref)}`,
    { headers },
  );

  if (!commitRes.ok) {
    throw new Error(`Branch "${ref}" not found.`);
  }

  const commit = (await commitRes.json()) as { commit: { tree: { sha: string } } };
  let treeSha = commit.commit.tree.sha;
  const parts = subpath.split("/").filter(Boolean);

  for (const part of parts) {
    const treeRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${treeSha}`,
      { headers },
    );

    if (!treeRes.ok) {
      throw new Error(`Subfolder "${subpath}" not found on branch "${ref}".`);
    }

    const tree = (await treeRes.json()) as {
      tree: { path: string; type: string; sha: string }[];
    };

    const entry = tree.tree.find((item) => item.path === part && item.type === "tree");
    if (!entry) {
      throw new Error(`Subfolder "${subpath}" not found on branch "${ref}".`);
    }

    treeSha = entry.sha;
  }

  return treeSha;
}

async function treeForImport(
  parsed: ParsedGitHubUrl,
  ref: string,
  rootTree: RepoTree,
): Promise<TreeBlob[]> {
  if (!parsed.subpath) {
    if (rootTree.truncated) {
      throw new Error("truncated-root");
    }
    return rootTree.blobs;
  }

  const prefix = `${parsed.subpath.replace(/\/$/, "")}/`;
  if (!rootTree.truncated) {
    const scoped = rootTree.blobs.filter((entry) => entry.path.startsWith(prefix));
    if (scoped.length > 0) return scoped;
  }

  return fetchSubpathTree(parsed, ref, parsed.subpath);
}

async function resolveRemoteRoots(
  parsed: ParsedGitHubUrl,
  ref: string,
  rootTree: RepoTree,
): Promise<string[]> {
  const blobPaths = rootTree.blobs.map((t) => t.path);

  if (rootTree.truncated) {
    return discoverAppRootsRemote(parsed, ref, ghHeaders(), blobPaths);
  }

  const localCount = mergeDiscoveredRoots(blobPaths, []).length;
  if (localCount >= 2) return [];
  if (localCount === 1 && !parsed.subpath) return [];

  return discoverAppRootsRemote(parsed, ref, ghHeaders(), blobPaths);
}

function selectFiles(tree: TreeBlob[], parsed: ParsedGitHubUrl): TreeBlob[] {
  return tree
    .filter((entry) => shouldIncludeFile(entry.path, parsed.subpath))
    .filter((entry) => entry.size <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES);
}

function hasAppFiles(tree: TreeBlob[], parsed: ParsedGitHubUrl): boolean {
  return tree.some((entry) => {
    const rel = parsed.subpath ? stripSubpath(entry.path, parsed.subpath) : entry.path;
    if (rel == null || rel.includes("..")) return false;
    return rel.startsWith("app/") || rel.startsWith("src/app/") || rel === "app" || rel === "src/app";
  });
}

function resolveSubpath(
  parsed: ParsedGitHubUrl,
  ref: string,
  rootTree: RepoTree,
  remoteRoots: string[],
): ParsedGitHubUrl {
  if (parsed.subpath) return parsed;

  if (hasAppFiles(rootTree.blobs, parsed)) {
    return parsed;
  }

  const blobPaths = rootTree.blobs.map((t) => t.path);
  const roots = mergeDiscoveredRoots(blobPaths, remoteRoots);

  if (roots.length === 1) {
    return { ...parsed, subpath: roots[0] };
  }

  if (rootTree.truncated) {
    throw new Error(buildTruncatedRepoError(parsed, ref, blobPaths, remoteRoots));
  }

  throw new Error(buildMonorepoError(parsed, ref, blobPaths, remoteRoots));
}

async function downloadFile(
  parsed: ParsedGitHubUrl,
  ref: string,
  repoPath: string,
  destRoot: string,
): Promise<void> {
  const rel = parsed.subpath ? stripSubpath(repoPath, parsed.subpath) : repoPath;
  if (rel == null) return;

  const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${ref}/${repoPath}`;
  const res = await fetch(url, { headers: { "User-Agent": "Route-Studio" } });
  if (!res.ok) throw new Error(`Failed to download ${repoPath}`);

  const dest = path.join(destRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, await res.text());
}

async function materializeRepo(
  parsed: ParsedGitHubUrl,
  ref: string,
  rootTree: RepoTree,
  remoteRoots: string[],
): Promise<string> {
  let tree: TreeBlob[];

  try {
    tree = await treeForImport(parsed, ref, rootTree);
  } catch (error) {
    if (error instanceof Error && error.message === "truncated-root") {
      throw new Error(
        buildTruncatedRepoError(parsed, ref, rootTree.blobs.map((t) => t.path), remoteRoots),
      );
    }
    throw error;
  }

  const files = selectFiles(tree, parsed);

  if (files.length === 0) {
    const blobPaths = tree.map((t) => t.path);
    throw new Error(
      parsed.subpath
        ? `No app/ folder found under "${parsed.subpath}". Point to the Next.js app root.`
        : buildMonorepoError(parsed, ref, blobPaths, remoteRoots),
    );
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "route-studio-"));

  try {
    for (const file of files) {
      await downloadFile(parsed, ref, file.path, tempRoot);
    }
    return tempRoot;
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

export async function importGitHubProject(
  url: string,
): Promise<
  | { ok: true; project: RouteProject; repoUrl: string; ref: string }
  | { ok: false; error: string; suggestions?: string[] }
> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return { ok: false, error: "Invalid GitHub URL. Example: https://github.com/owner/repo" };
  }

  try {
    const ref = await resolveRef(parsed);
    const rootTree = await fetchRepoTree(parsed, ref);
    const blobPaths = rootTree.blobs.map((t) => t.path);

    const remoteRoots = await resolveRemoteRoots(parsed, ref, rootTree);
    const suggestions = () => buildImportSuggestions(parsed, ref, blobPaths, remoteRoots);

    let active: ParsedGitHubUrl;
    try {
      active = resolveSubpath(parsed, ref, rootTree, remoteRoots);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "No app/ directory found.",
        suggestions: suggestions(),
      };
    }

    const key = cacheKey(active, ref);
    const cached = projectCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return {
        ok: true,
        project: cached.project,
        repoUrl: formatGitHubUrl(active, ref),
        ref,
      };
    }

    const tempRoot = await materializeRepo(active, ref, rootTree, remoteRoots);

    try {
      const result = scanProject(tempRoot);
      if (!result.ok) {
        return { ok: false, error: result.error, suggestions: suggestions() };
      }

      const project: RouteProject = {
        ...result.project,
        name: active.subpath ? `${active.repo}/${active.subpath}` : active.repo,
        rootPath: formatGitHubUrl(active, ref),
        github: {
          owner: active.owner,
          repo: active.repo,
          ref,
          subpath: active.subpath,
        },
      };

      projectCache.set(key, { project, expires: Date.now() + CACHE_TTL_MS });

      return {
        ok: true,
        project,
        repoUrl: formatGitHubUrl(active, ref),
        ref,
      };
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to import repository.",
    };
  }
}
