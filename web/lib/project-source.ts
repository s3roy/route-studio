"use client";

import { useEffect, useState } from "react";
import {
  loadStudioSession,
  saveStudioSession,
  type ProjectSource,
} from "./studio-session";

export type { ProjectSource } from "./studio-session";

export function loadProjectSource(): ProjectSource {
  return loadStudioSession().source;
}

export function saveProjectSource(source: ProjectSource): void {
  const current = loadStudioSession();
  saveStudioSession({ ...current, source });
}

export function useProjectSource(): ProjectSource {
  const [source, setSource] = useState<ProjectSource>({ type: "demo" });

  useEffect(() => {
    setSource(loadProjectSource());
  }, []);

  return source;
}

export { githubQueryParam, routeDetailHrefForSession, routeLinkQueryFromSource, shareQueryParam } from "./studio-session";
