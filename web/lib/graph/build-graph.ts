import type { Edge, Node } from "@xyflow/react";
import type { FileTreeNode, RouteProject, RouteSegment } from "@/lib/analyzer";

export type GraphNodeKind = "layout" | "page" | "route" | "loading";

export type RouteNodeData = {
  label: string;
  sublabel: string;
  filePath: string;
  nodeKind: GraphNodeKind;
  tag?: string;
  routeUrl?: string;
  routeId?: string;
};

const NODE_W = 200;
const NODE_H = 72;
const X_GAP = 52;
const Y_GAP = 96;

function walkFiles(
  nodes: FileTreeNode[],
  onFile: (node: FileTreeNode) => void,
): void {
  for (const node of nodes) {
    if (node.type === "file") onFile(node);
    if (node.children) walkFiles(node.children, onFile);
  }
}

function layoutPathForDir(dir: string, layouts: Set<string>): string | null {
  let current = dir;
  while (current.startsWith("app")) {
    const candidate = `${current}/layout.tsx`;
    if (layouts.has(candidate)) return candidate;
    if (current === "app") break;
    current = current.slice(0, current.lastIndexOf("/"));
  }
  return null;
}

function routeForFile(routes: RouteSegment[], filePath: string): RouteSegment | undefined {
  return routes.find((r) => r.files.some((f) => f.path === filePath));
}

function tagForRoute(route: RouteSegment | undefined, filePath: string): string | undefined {
  if (!route) return undefined;
  const file = route.files.find((f) => f.path === filePath);
  if (!file) return undefined;
  if (file.kind === "route") return "API";
  if (file.isClientComponent) return "Client";
  if (route.isRSC) return "RSC";
  return undefined;
}

function labelForKind(kind: GraphNodeKind): string {
  switch (kind) {
    case "layout":
      return "Layout";
    case "page":
      return "Page";
    case "route":
      return "API Route";
    case "loading":
      return "Loading";
  }
}

function edgeStyle(
  sourceKind: GraphNodeKind,
  targetKind: GraphNodeKind,
  dashed: boolean,
): { stroke: string; strokeDasharray?: string } {
  if (dashed) return { stroke: "#a855f7", strokeDasharray: "6 4" };
  if (targetKind === "page" || targetKind === "route") return { stroke: "#14b8a6" };
  return { stroke: "#a855f7" };
}

export function buildRouteGraph(project: RouteProject): { nodes: Node[]; edges: Edge[] } {
  const layouts = new Set<string>();
  const loadings: string[] = [];

  walkFiles(project.tree, (node) => {
    if (node.routeFileKind === "layout") layouts.add(node.path);
    if (node.routeFileKind === "loading") loadings.push(node.path);
  });

  const rootLayout = `${project.appDir}/layout.tsx`;
  if (!layouts.has(rootLayout)) {
    return { nodes: [], edges: [] };
  }

  type GraphItem = {
    id: string;
    parentId: string | null;
    kind: GraphNodeKind;
    filePath: string;
    dashed: boolean;
  };

  const items: GraphItem[] = [];

  for (const layoutPath of [...layouts].sort()) {
    const dir = layoutPath.slice(0, layoutPath.lastIndexOf("/"));
    const parentDir = dir.slice(0, dir.lastIndexOf("/"));
    const parentPath =
      layoutPath === rootLayout ? null : layoutPathForDir(parentDir, layouts) ?? rootLayout;
    items.push({
      id: layoutPath,
      parentId: parentPath,
      kind: "layout",
      filePath: layoutPath,
      dashed: false,
    });
  }

  for (const route of project.routes) {
    const page = route.files.find((f) => f.kind === "page");
    const handler = route.files.find((f) => f.kind === "route");
    const target = page ?? handler;
    if (!target) continue;

    const dir = target.path.slice(0, target.path.lastIndexOf("/"));
    const parentLayout = layoutPathForDir(dir, layouts) ?? rootLayout;
    const inRouteGroup = route.segments.some((s) => s.kind === "route-group");

    items.push({
      id: target.path,
      parentId: parentLayout,
      kind: handler ? "route" : "page",
      filePath: target.path,
      dashed: inRouteGroup,
    });
  }

  for (const loadingPath of loadings) {
    const dir = loadingPath.slice(0, loadingPath.lastIndexOf("/"));
    const parentLayout = layoutPathForDir(dir, layouts);
    if (!parentLayout) continue;
    items.push({
      id: loadingPath,
      parentId: parentLayout,
      kind: "loading",
      filePath: loadingPath,
      dashed: true,
    });
  }

  const childrenByParent = new Map<string | null, GraphItem[]>();
  for (const item of items) {
    const list = childrenByParent.get(item.parentId) ?? [];
    list.push(item);
    childrenByParent.set(item.parentId, list);
  }

  const positions = new Map<string, { x: number; y: number }>();

  function layoutSubtree(parentId: string | null, depth: number, xStart: number): number {
    const children = childrenByParent.get(parentId) ?? [];
    if (children.length === 0) return xStart;

    let x = xStart;
    for (const child of children) {
      const subtreeWidth = layoutSubtree(child.id, depth + 1, x);
      const width = Math.max(NODE_W, subtreeWidth - x);
      positions.set(child.id, { x: x + width / 2 - NODE_W / 2, y: depth * (NODE_H + Y_GAP) });
      x += width + X_GAP;
    }
    return x - X_GAP;
  }

  positions.set(rootLayout, { x: 0, y: 0 });
  layoutSubtree(rootLayout, 1, -((childrenByParent.get(rootLayout)?.length ?? 1) * (NODE_W + X_GAP)) / 2);

  const nodes: Node<RouteNodeData>[] = items.map((item) => {
    const route = routeForFile(project.routes, item.filePath);
    const pos = positions.get(item.id) ?? { x: 0, y: 0 };
    const segmentLabel =
      item.kind === "layout"
        ? item.filePath.replace(`${project.appDir}/`, "").replace("/layout.tsx", "") || "root"
        : route?.urlPath ?? item.filePath;

    return {
      id: item.id,
      type: "routeNode",
      position: pos,
      data: {
        label: labelForKind(item.kind),
        sublabel: segmentLabel,
        filePath: item.filePath,
        nodeKind: item.kind,
        tag: tagForRoute(route, item.filePath),
        routeUrl: route?.urlPath,
        routeId: route?.id,
      },
    };
  });

  const itemById = new Map(items.map((i) => [i.id, i]));
  const edges: Edge[] = items
    .filter((item) => item.parentId)
    .map((item) => {
      const parent = itemById.get(item.parentId!);
      return {
        id: `${item.parentId}->${item.id}`,
        source: item.parentId!,
        target: item.id,
        type: "smoothstep",
        style: edgeStyle(parent?.kind ?? "layout", item.kind, item.dashed),
      };
    });

  return { nodes, edges };
}
