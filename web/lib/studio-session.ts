"use client";

import type { RouteProject } from "@/lib/analyzer";
import { DEMO_ROUTE_DETAIL } from "@/lib/demo-routes";
import { defaultRouteForProject } from "@/lib/route-detail/resolve-route";
import { routeDetailHref } from "@/lib/route-detail/urls";

export type ProjectSource =
  | { type: "demo" }
  | { type: "github"; url: string }
  | { type: "upload"; name: string }
  | { type: "share"; shareId: string };

export type StudioSession = {
  source: ProjectSource;
  selectedPath: string | null;
  /** Cached scan — kept for uploads; also caches github/share to restore instantly. */
  project?: RouteProject;
};

const SESSION_KEY = "route-studio:session";
const LEGACY_SESSION_KEY = "route-studio:source";

function defaultSession(): StudioSession {
  return { source: { type: "demo" }, selectedPath: null };
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isProjectSource(value: unknown): value is ProjectSource {
  if (!value || typeof value !== "object") return false;
  const type = (value as ProjectSource).type;
  return type === "demo" || type === "github" || type === "upload" || type === "share";
}

function normalizeSession(raw: unknown): StudioSession | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Partial<StudioSession>;
  if (!isProjectSource(data.source)) return null;

  return {
    source: data.source,
    selectedPath: typeof data.selectedPath === "string" ? data.selectedPath : null,
    project: data.project,
  };
}

/** Read persisted studio session from localStorage (migrates legacy sessionStorage source). */
export function loadStudioSession(): StudioSession {
  if (typeof window === "undefined") return defaultSession();

  const stored = normalizeSession(readJson(localStorage.getItem(SESSION_KEY)));
  if (stored) return stored;

  const legacy = readJson<ProjectSource>(sessionStorage.getItem(LEGACY_SESSION_KEY));
  if (legacy && isProjectSource(legacy) && legacy.type !== "demo") {
    const migrated: StudioSession = { source: legacy, selectedPath: null };
    saveStudioSession(migrated);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return migrated;
  }

  return defaultSession();
}

/** Persist studio session. Demo-only sessions store selectedPath but drop cached project. */
export function saveStudioSession(session: StudioSession): void {
  if (typeof window === "undefined") return;

  if (session.source.type === "demo" && !session.selectedPath) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  const payload: StudioSession =
    session.source.type === "demo"
      ? { source: session.source, selectedPath: session.selectedPath }
      : session;

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          source: session.source,
          selectedPath: session.selectedPath,
        } satisfies StudioSession),
      );
    } catch {
      // ignore — persistence best-effort
    }
  }
}

export function clearStudioSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
}

export async function restoreStudioProject(
  session: StudioSession,
): Promise<{ project: RouteProject; selectedPath: string | null } | null> {
  if (session.project) {
    return {
      project: session.project,
      selectedPath: session.selectedPath,
    };
  }

  if (session.source.type === "github") {
    const res = await fetch("/api/import/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.source.url }),
    });
    const data = (await res.json()) as
      | { ok: true; project: RouteProject }
      | { ok: false; error: string };
    if (!data.ok) return null;
    return { project: data.project, selectedPath: session.selectedPath };
  }

  if (session.source.type === "share") {
    const res = await fetch(`/api/share?id=${encodeURIComponent(session.source.shareId)}`);
    const data = (await res.json()) as
      | { ok: true; project: RouteProject; selectedPath?: string }
      | { ok: false; error: string };
    if (!data.ok) return null;
    return {
      project: data.project,
      selectedPath: data.selectedPath ?? session.selectedPath,
    };
  }

  return null;
}

export function githubQueryParam(source: ProjectSource): string | null {
  return source.type === "github" ? source.url : null;
}

export function shareQueryParam(source: ProjectSource): string | null {
  return source.type === "share" ? source.shareId : null;
}

export function routeLinkQueryFromSource(source: ProjectSource): {
  github?: string | null;
  share?: string | null;
} {
  if (source.type === "github") return { github: source.url };
  if (source.type === "share") return { share: source.shareId };
  return {};
}

/** Client-only: route detail link for the current studio session (nav settings icon). */
export function routeDetailHrefForSession(): string {
  const session = loadStudioSession();
  const query = routeLinkQueryFromSource(session.source);

  if (session.project) {
    const route = defaultRouteForProject(session.project, session.selectedPath);
    if (route) return routeDetailHref(route.id, query);
  }

  return routeDetailHref(DEMO_ROUTE_DETAIL.id, query);
}
