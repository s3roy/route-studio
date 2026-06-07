"use client";

import { useEffect, useState } from "react";

export type ProjectSource =
  | { type: "demo" }
  | { type: "github"; url: string };

const STORAGE_KEY = "route-studio:source";

export function loadProjectSource(): ProjectSource {
  if (typeof window === "undefined") return { type: "demo" };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { type: "demo" };
    return JSON.parse(raw) as ProjectSource;
  } catch {
    return { type: "demo" };
  }
}

export function saveProjectSource(source: ProjectSource): void {
  if (source.type === "demo") {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(source));
}

export function useProjectSource(): ProjectSource {
  const [source, setSource] = useState<ProjectSource>({ type: "demo" });

  useEffect(() => {
    setSource(loadProjectSource());
  }, []);

  return source;
}

export function githubQueryParam(source: ProjectSource): string | null {
  return source.type === "github" ? source.url : null;
}
