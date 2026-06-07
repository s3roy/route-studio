/** Route file kinds under app/ (Next.js special files). */
export type RouteFileKind =
  | "page"
  | "layout"
  | "loading"
  | "error"
  | "not-found"
  | "template"
  | "default"
  | "route";

export type FileTreeNode = {
  name: string;
  /** Relative path from project root (posix). */
  path: string;
  type: "file" | "directory";
  routeFileKind?: RouteFileKind;
  children?: FileTreeNode[];
};

export type SegmentKind =
  | "static"
  | "dynamic"
  | "catch-all"
  | "optional-catch-all"
  | "route-group"
  | "parallel"
  | "intercepting";

export type ParsedSegment = {
  raw: string;
  kind: SegmentKind;
  /** URL piece, e.g. `[id]` → `:id`, `(auth)` → omitted */
  urlPart: string | null;
};

export type RouteFile = {
  kind: RouteFileKind;
  path: string;
  isClientComponent: boolean;
};

export type RenderingMode = "static" | "dynamic" | "unknown";

export type RouteSegment = {
  id: string;
  urlPath: string;
  /** Path under app dir, e.g. `dashboard/settings` */
  segmentPath: string;
  segments: ParsedSegment[];
  files: RouteFile[];
  rendering: RenderingMode;
  revalidate: number | null;
  runtime: "nodejs" | "edge" | "auto";
  isRSC: boolean;
  hasClientBoundary: boolean;
  cacheNotes: string[];
};

export type ProxyInfo = {
  kind: "proxy" | "middleware";
  path: string;
};

export type GitHubSource = {
  owner: string;
  repo: string;
  ref: string;
  subpath?: string;
};

export type RouteProject = {
  name: string;
  rootPath: string;
  appDir: string;
  nextVersion: string | null;
  proxy: ProxyInfo | null;
  tree: FileTreeNode[];
  routes: RouteSegment[];
  github?: GitHubSource;
};

export type ScanResult =
  | { ok: true; project: RouteProject }
  | { ok: false; error: string };
