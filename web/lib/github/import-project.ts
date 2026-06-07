import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanProject, type RouteProject } from "@/lib/analyzer";
import {
  buildImportSuggestions,
  buildMonorepoError,
  discoverAppRoots,
  rankAppRoots,
} from "./discover-apps";
import { formatGitHubUrl, parseGitHubUrl, type ParsedGitHubUrl } from "./parse-url";

const MAX_FILES = 400;
const MAX_FILE_BYTES = 512_000;
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { project: RouteProject; expires: number };
type TreeBlob = { path: string; size: number };

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

async function fetchRepoTree(parsed: ParsedGitHubUrl, ref: string): Promise<TreeBlob[]> {
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

  if (data.truncated) {
    throw new Error("Repository is too large to scan at once. Paste a subfolder URL (…/tree/main/apps/web).");
  }

  return data.tree
    .filter((entry) => entry.type === "blob")
    .map((entry) => ({ path: entry.path, size: entry.size ?? 0 }));
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
    return rel.startsWith("app/") || rel.startsWith("src/app/");
  });
}

function resolveSubpath(
  parsed: ParsedGitHubUrl,
  ref: string,
  tree: TreeBlob[],
): ParsedGitHubUrl {
  if (parsed.subpath) return parsed;

  if (hasAppFiles(tree, parsed)) {
    return parsed;
  }

  const blobPaths = tree.map((t) => t.path);
  const roots = rankAppRoots(discoverAppRoots(blobPaths), blobPaths);
  if (roots.length === 1) {
    return { ...parsed, subpath: roots[0] };
  }

  throw new Error(buildMonorepoError(parsed, ref, blobPaths));
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

async function materializeRepo(active: ParsedGitHubUrl, ref: string, tree: TreeBlob[]): Promise<string> {
  const files = selectFiles(tree, active);

  if (files.length === 0) {
    throw new Error(
      active.subpath
        ? `No app/ folder found under "${active.subpath}". Point to the Next.js app root.`
        : buildMonorepoError(active, ref, tree.map((t) => t.path)),
    );
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "route-studio-"));

  try {
    for (const file of files) {
      await downloadFile(active, ref, file.path, tempRoot);
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
    const tree = await fetchRepoTree(parsed, ref);
    const blobPaths = tree.map((t) => t.path);
    const suggestions = () => buildImportSuggestions(parsed, ref, blobPaths);

    let active: ParsedGitHubUrl;
    try {
      active = resolveSubpath(parsed, ref, tree);
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

    const tempRoot = await materializeRepo(active, ref, tree);

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
