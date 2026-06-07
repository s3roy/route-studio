import type { RouteProject } from "@/lib/analyzer";

const TTL_MS = 60 * 60 * 1000; // 1 hour

type ShareEntry = {
  project: RouteProject;
  routeId?: string;
  selectedPath?: string;
  expires: number;
};

const store = new Map<string, ShareEntry>();

function prune() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expires < now) store.delete(id);
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createShareLink(data: {
  project: RouteProject;
  routeId?: string;
  selectedPath?: string;
}): string {
  prune();
  const id = randomId();
  store.set(id, { ...data, expires: Date.now() + TTL_MS });
  return id;
}

export function getShareEntry(id: string): ShareEntry | null {
  prune();
  const entry = store.get(id);
  if (!entry || entry.expires < Date.now()) {
    store.delete(id);
    return null;
  }
  return entry;
}
