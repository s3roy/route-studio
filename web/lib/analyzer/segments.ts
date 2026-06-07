import type { ParsedSegment, SegmentKind } from "./types";

const INTERCEPTING = /^\(\.\.?\.?\)/;

export function parseSegmentName(raw: string): ParsedSegment {
  if (raw.startsWith("(") && raw.endsWith(")") && !INTERCEPTING.test(raw)) {
    return { raw, kind: "route-group", urlPart: null };
  }
  if (raw.startsWith("@")) {
    return { raw, kind: "parallel", urlPart: null };
  }
  if (INTERCEPTING.test(raw)) {
    return { raw, kind: "intercepting", urlPart: null };
  }
  if (raw.startsWith("[[...") && raw.endsWith("]]")) {
    const name = raw.slice(5, -2);
    return { raw, kind: "optional-catch-all", urlPart: `[...${name}]` };
  }
  if (raw.startsWith("[...") && raw.endsWith("]")) {
    const name = raw.slice(4, -1);
    return { raw, kind: "catch-all", urlPart: `[...${name}]` };
  }
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const name = raw.slice(1, -1);
    return { raw, kind: "dynamic", urlPart: `:${name}` };
  }
  return { raw, kind: "static", urlPart: raw };
}

export function segmentsToUrlPath(segments: ParsedSegment[]): string {
  const parts = segments
    .map((s) => s.urlPart)
    .filter((p): p is string => p !== null);
  if (parts.length === 0) return "/";
  return "/" + parts.join("/");
}

export function segmentPathFromParts(parts: string[]): string {
  return parts.join("/");
}

export function kindLabel(kind: SegmentKind): string {
  switch (kind) {
    case "route-group":
      return "route group";
    case "parallel":
      return "parallel";
    case "intercepting":
      return "intercepting";
    case "dynamic":
      return "dynamic";
    case "catch-all":
      return "catch-all";
    case "optional-catch-all":
      return "optional catch-all";
    default:
      return "static";
  }
}
