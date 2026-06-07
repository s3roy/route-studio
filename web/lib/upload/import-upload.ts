import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanProject, type RouteProject } from "@/lib/analyzer";

const MAX_FILES = 400;
const MAX_FILE_BYTES = 512_000;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build"]);

export type UploadFile = {
  relativePath: string;
  content: Buffer;
};

export type ImportUploadResult =
  | { ok: true; project: RouteProject; projectName: string }
  | { ok: false; error: string };

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

function findAppPrefix(paths: string[]): string | null {
  for (const p of paths) {
    if (p === "app" || p.startsWith("app/")) return "";
    if (p === "src/app" || p.startsWith("src/app/")) return "src";
  }
  for (const p of paths) {
    const idx = p.indexOf("/app/");
    if (idx >= 0) return p.slice(0, idx);
    if (p.endsWith("/app")) return p.slice(0, -4);
  }
  return null;
}

export function importFromUpload(files: UploadFile[]): ImportUploadResult {
  if (files.length === 0) {
    return { ok: false, error: "No files received." };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, error: `Too many files (max ${MAX_FILES}). Try a smaller app/ folder.` };
  }

  const paths = files.map((f) => normalizePath(f.relativePath));
  const appPrefix = findAppPrefix(paths);

  if (appPrefix === null) {
    return {
      ok: false,
      error: "No app/ or src/app/ folder found. Upload a Next.js project root or app directory.",
    };
  }

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "route-studio-upload-"));

  try {
    let written = 0;
    for (const file of files) {
      const rel = normalizePath(file.relativePath);
      if (!rel.startsWith(appPrefix ? `${appPrefix}/` : "") && !(appPrefix === "" && !rel.includes("/app"))) {
        // keep files under detected project root
      }

      const parts = rel.split("/");
      if (parts.some((seg) => SKIP_DIRS.has(seg))) continue;
      if (file.content.length > MAX_FILE_BYTES) continue;

      const dest = path.join(tmpRoot, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, file.content);
      written++;
    }

    if (written === 0) {
      return { ok: false, error: "No scannable files after filtering node_modules and large files." };
    }

    const scanRoot = appPrefix ? path.join(tmpRoot, appPrefix) : tmpRoot;
    const result = scanProject(scanRoot);

    if (!result.ok) {
      // scan from tmp root if nested prefix failed
      const fallback = scanProject(tmpRoot);
      if (!fallback.ok) return { ok: false, error: result.error };
      const name = paths[0]?.split("/")[0] ?? "uploaded-project";
      return { ok: true, project: fallback.project, projectName: name };
    }

    const name =
      appPrefix.split("/").pop() ||
      paths.find((p) => p.includes("package.json"))?.split("/")[0] ||
      "uploaded-project";

    return { ok: true, project: result.project, projectName: name };
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}
