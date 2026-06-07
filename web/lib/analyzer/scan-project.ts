import fs from "node:fs";
import path from "node:path";
import {
  analyzeSource,
  classifyRouteFile,
  readRuntime,
  toPosix,
} from "./analyze-file";
import { parseSegmentName, segmentPathFromParts, segmentsToUrlPath } from "./segments";
import type {
  FileTreeNode,
  ParsedSegment,
  ProxyInfo,
  RouteFile,
  RouteProject,
  RouteSegment,
  ScanResult,
} from "./types";

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build"]);

function findAppDir(root: string): string | null {
  const candidates = ["app", path.join("src", "app")];
  for (const rel of candidates) {
    const full = path.join(root, rel);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      return rel;
    }
  }
  return null;
}

function findProxy(root: string): ProxyInfo | null {
  const names = [
    "proxy.ts",
    "proxy.js",
    "src/proxy.ts",
    "src/proxy.js",
    "middleware.ts",
    "middleware.js",
    "src/middleware.ts",
    "src/middleware.js",
  ];
  for (const rel of names) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      return {
        kind: rel.includes("proxy") ? "proxy" : "middleware",
        path: toPosix(rel),
      };
    }
  }
  return null;
}

function readNextVersion(root: string): string | null {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return pkg.dependencies?.next ?? pkg.devDependencies?.next ?? null;
  } catch {
    return null;
  }
}

function walkTree(dir: string, relBase: string): FileTreeNode[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") && entry.name !== ".") continue;
    const rel = toPosix(path.join(relBase, entry.name));
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      nodes.push({
        name: entry.name,
        path: rel,
        type: "directory",
        children: walkTree(full, rel),
      });
    } else if (entry.isFile()) {
      const kind = classifyRouteFile(entry.name);
      nodes.push({
        name: entry.name,
        path: rel,
        type: "file",
        routeFileKind: kind ?? undefined,
      });
    }
  }
  return nodes;
}

function collectRouteSegments(
  appAbs: string,
  appRel: string,
  folderParts: string[],
  segmentChain: ParsedSegment[],
  routes: RouteSegment[],
): void {
  const dir = path.join(appAbs, ...folderParts);
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: RouteFile[] = [];
  let combinedSource = "";
  let pageRuntime: "nodejs" | "edge" | "auto" = "auto";

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const kind = classifyRouteFile(entry.name);
    if (!kind) continue;
    const filePath = toPosix(path.join(appRel, ...folderParts, entry.name));
    const abs = path.join(dir, entry.name);
    const source = fs.readFileSync(abs, "utf8");
    const analyzed = analyzeSource(source);
    if (kind === "page" || kind === "route") {
      pageRuntime = readRuntime(source);
    }
    combinedSource += source + "\n";
    files.push({
      kind,
      path: filePath,
      isClientComponent: analyzed.isClientComponent,
    });
  }

  const hasPage = files.some((f) => f.kind === "page");
  const hasRoute = files.some((f) => f.kind === "route");

  let hasClientBoundary = files.some((f) => f.isClientComponent);

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (classifyRouteFile(entry.name)) continue;
    if (!/\.(tsx|jsx)$/.test(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const source = fs.readFileSync(abs, "utf8");
    if (analyzeSource(source).isClientComponent) {
      hasClientBoundary = true;
    }
  }

  if (hasPage || hasRoute) {
    const analyzed = analyzeSource(combinedSource);
    const urlPath = segmentsToUrlPath(segmentChain);
    const segPath = segmentPathFromParts(folderParts);

    routes.push({
      id: segPath || "/",
      urlPath: urlPath === "/" && segPath === "" ? "/" : urlPath,
      segmentPath: segPath,
      segments: [...segmentChain],
      files,
      rendering: analyzed.rendering,
      revalidate: analyzed.revalidate,
      runtime: pageRuntime,
      isRSC: files.some((f) => f.kind === "page" && !f.isClientComponent),
      hasClientBoundary,
      cacheNotes: analyzed.cacheNotes,
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    const nextParts = [...folderParts, entry.name];
    const parsed = parseSegmentName(entry.name);
    const nextChain =
      parsed.kind === "route-group" || parsed.kind === "parallel"
        ? segmentChain
        : [...segmentChain, parsed];
    collectRouteSegments(appAbs, appRel, nextParts, nextChain, routes);
  }
}

export function scanProject(rootPath: string): ScanResult {
  const root = path.resolve(rootPath);
  if (!fs.existsSync(root)) {
    return { ok: false, error: `Path not found: ${root}` };
  }

  const appRel = findAppDir(root);
  if (!appRel) {
    return { ok: false, error: "No app/ or src/app/ directory found" };
  }

  const appAbs = path.join(root, appRel);
  const name = path.basename(root);
  const tree = walkTree(appAbs, appRel);
  const routes: RouteSegment[] = [];
  collectRouteSegments(appAbs, appRel, [], [], routes);

  routes.sort((a, b) => a.urlPath.localeCompare(b.urlPath));

  const project: RouteProject = {
    name,
    rootPath: root,
    appDir: appRel,
    nextVersion: readNextVersion(root),
    proxy: findProxy(root),
    tree,
    routes,
  };

  return { ok: true, project };
}
