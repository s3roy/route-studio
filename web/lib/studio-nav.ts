export type StudioPanel = "tree" | "graph" | "insights";

export function studioPanelHref(panel: StudioPanel): string {
  return `/studio?panel=${panel}`;
}

export function parseStudioPanel(value: string | null): StudioPanel | null {
  if (value === "tree" || value === "graph" || value === "insights") return value;
  return null;
}
