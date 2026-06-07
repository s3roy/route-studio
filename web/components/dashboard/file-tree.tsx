"use client";

import { useState } from "react";
import type { FileTreeNode, RouteFileKind } from "@/lib/analyzer";

const kindIcons: Partial<Record<RouteFileKind, string>> = {
  layout: "◫",
  page: "◧",
  loading: "◌",
  route: "{ }",
};

type FileTreeProps = {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
};

export function FileTree({ nodes, selectedPath, onSelect }: FileTreeProps) {
  return (
    <ul className="space-y-0.5 text-sm">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const isDir = node.type === "directory";
  const selected = selectedPath === node.path;
  const icon = node.routeFileKind ? (kindIcons[node.routeFileKind] ?? "·") : isDir ? "▸" : "·";

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          if (isDir) setOpen((v) => !v);
          else onSelect(node.path);
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition ${
          selected
            ? "bg-violet-500/20 text-violet-100"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="w-3 shrink-0 text-[10px] text-zinc-600">
          {isDir ? (open ? "▾" : "▸") : icon}
        </span>
        <span className="truncate font-mono text-xs">{node.name}</span>
        {node.routeFileKind ? (
          <span className="ml-auto shrink-0 text-[10px] uppercase text-zinc-600">
            {node.routeFileKind}
          </span>
        ) : null}
      </button>
      {isDir && open && node.children?.length ? (
        <ul>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
