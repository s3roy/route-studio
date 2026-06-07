import type { FileTreeNode, RouteProject, RouteSegment } from "@/lib/analyzer";

function layoutExists(tree: FileTreeNode[], layoutPath: string): boolean {
  let found = false;
  walk(tree, (node) => {
    if (node.type === "file" && node.path === layoutPath && node.routeFileKind === "layout") {
      found = true;
    }
  });
  return found;
}

function walk(nodes: FileTreeNode[], onNode: (node: FileTreeNode) => void): void {
  for (const node of nodes) {
    onNode(node);
    if (node.children) walk(node.children, onNode);
  }
}

export function findRouteById(project: RouteProject, routeId: string): RouteSegment | undefined {
  return project.routes.find((r) => r.id === routeId);
}

export function getLayoutChain(project: RouteProject, route: RouteSegment): string[] {
  const chain: string[] = [];
  const rootLayout = `${project.appDir}/layout.tsx`;
  if (layoutExists(project.tree, rootLayout)) chain.push(rootLayout);

  if (!route.segmentPath) return chain;

  let acc = project.appDir;
  for (const part of route.segmentPath.split("/")) {
    acc = `${acc}/${part}`;
    const layoutPath = `${acc}/layout.tsx`;
    if (layoutExists(project.tree, layoutPath)) chain.push(layoutPath);
  }

  return chain;
}

const DESCRIPTIONS: Record<string, string> = {
  "/": "Marketing home page for the app shell.",
  "/dashboard": "Authenticated dashboard overview.",
  "/dashboard/settings": "User settings and preferences management page.",
  "/login": "Sign-in page inside the (auth) route group.",
  "/register": "Account registration page inside the (auth) route group.",
  "/api/health": "Health check API endpoint.",
};

export function describeRoute(route: RouteSegment): string {
  return (
    DESCRIPTIONS[route.urlPath] ??
    `App Router segment at ${route.urlPath} — scanned from ${route.segmentPath || "root"}.`
  );
}

export function segmentConfigLabel(route: RouteSegment): string {
  if (route.cacheNotes.some((n) => n.includes("force-dynamic"))) return "force-dynamic";
  if (route.cacheNotes.some((n) => n.includes("force-static"))) return "force-static";
  return "auto";
}

export function runtimeLabel(route: RouteSegment): string {
  if (route.runtime === "edge") return "Edge";
  if (route.runtime === "nodejs") return "Node.js";
  return "Node.js";
}
