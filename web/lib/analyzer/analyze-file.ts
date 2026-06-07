import path from "node:path";
import type { RenderingMode, RouteFileKind } from "./types";

const ROUTE_FILE_RE =
  /^(page|layout|loading|error|not-found|template|default|route)\.(tsx|ts|jsx|js)$/;

export function classifyRouteFile(filename: string): RouteFileKind | null {
  const m = filename.match(ROUTE_FILE_RE);
  return m ? (m[1] as RouteFileKind) : null;
}

export function analyzeSource(source: string): {
  isClientComponent: boolean;
  rendering: RenderingMode;
  revalidate: number | null;
  cacheNotes: string[];
} {
  const cacheNotes: string[] = [];
  const isClientComponent =
    /^["']use client["'];?\s*$/m.test(source.trimStart().slice(0, 40)) ||
    source.includes('"use client"') ||
    source.includes("'use client'");

  let rendering: RenderingMode = "unknown";
  let revalidate: number | null = null;

  if (/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(source)) {
    rendering = "dynamic";
    cacheNotes.push("export const dynamic = 'force-dynamic'");
  } else if (/export\s+const\s+dynamic\s*=\s*['"]force-static['"]/.test(source)) {
    rendering = "static";
    cacheNotes.push("export const dynamic = 'force-static'");
  }

  const revalidateMatch = source.match(
    /export\s+const\s+revalidate\s*=\s*(\d+|false)/,
  );
  if (revalidateMatch) {
    if (revalidateMatch[1] === "false") {
      revalidate = 0;
      rendering = "dynamic";
      cacheNotes.push("export const revalidate = false (always dynamic)");
    } else {
      revalidate = Number(revalidateMatch[1]);
      cacheNotes.push(`export const revalidate = ${revalidate}`);
    }
  }

  if (/cache\s*:\s*['"]no-store['"]/.test(source)) {
    rendering = "dynamic";
    cacheNotes.push("fetch with cache: 'no-store'");
  }

  if (/export\s+const\s+fetchCache\s*=\s*['"]force-no-store['"]/.test(source)) {
    rendering = "dynamic";
    cacheNotes.push("export const fetchCache = 'force-no-store'");
  }

  if (/\bcookies\s*\(/.test(source) || /\bheaders\s*\(/.test(source)) {
    rendering = "dynamic";
    cacheNotes.push("uses cookies() or headers()");
  }

  if (rendering === "unknown" && !isClientComponent) {
    rendering = "static";
  }

  if (isClientComponent) {
    cacheNotes.push('"use client" — client component boundary');
  }

  return { isClientComponent, rendering, revalidate, cacheNotes };
}

export function readRuntime(source: string): "nodejs" | "edge" | "auto" {
  if (/export\s+const\s+runtime\s*=\s*['"]edge['"]/.test(source)) return "edge";
  if (/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(source)) return "nodejs";
  return "auto";
}

export function toPosix(rel: string): string {
  return rel.split(path.sep).join("/");
}
