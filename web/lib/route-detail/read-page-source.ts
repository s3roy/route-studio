import fs from "node:fs";
import path from "node:path";
import type { RouteProject, RouteSegment } from "@/lib/analyzer";

function githubRawPath(project: RouteProject, filePath: string): string | null {
  if (!project.github) return null;
  const { subpath } = project.github;
  return subpath ? `${subpath.replace(/\/$/, "")}/${filePath}` : filePath;
}

export async function readPageSource(
  project: RouteProject,
  route: RouteSegment,
): Promise<string | null> {
  const page = route.files.find((f) => f.kind === "page");
  if (!page) return null;

  if (project.github) {
    const { owner, repo, ref } = project.github;
    const repoPath = githubRawPath(project, page.path);
    if (!repoPath) return null;

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${repoPath}`;
    const res = await fetch(url, { headers: { "User-Agent": "Route-Studio" } });
    if (!res.ok) return null;
    return res.text();
  }

  const abs = path.join(project.rootPath, page.path);
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}
