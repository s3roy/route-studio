"use client";

import { useEffect, useRef, useState } from "react";
import type { FileTreeNode, RouteFileKind } from "@/lib/analyzer";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  RouteFileKindIcon,
} from "@/components/icons";

type FileTreeProps = {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
};

function containsSelectedPath(node: FileTreeNode, selectedPath: string | null): boolean {
  if (!selectedPath) return false;
  if (node.path === selectedPath) return true;
  if (selectedPath.startsWith(`${node.path}/`)) return true;
  return node.children?.some((child) => containsSelectedPath(child, selectedPath)) ?? false;
}

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
  const isDir = node.type === "directory";
  const selected = selectedPath === node.path;
  const rowRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(() => isDir && containsSelectedPath(node, selectedPath));

  useEffect(() => {
    if (isDir && containsSelectedPath(node, selectedPath)) {
      setOpen(true);
    }
  }, [isDir, node.path, selectedPath]);

  useEffect(() => {
    if (!selected || !rowRef.current) return;
    rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected, selectedPath]);

  return (
    <li>
      <button
        ref={rowRef}
        type="button"
        onClick={() => {
          if (isDir) setOpen((v) => !v);
          else onSelect(node.path);
        }}
        className={`flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left transition ${
          selected ? "theme-selected font-medium" : "theme-muted theme-hover"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="flex w-3 shrink-0 items-center justify-center">
          {isDir ? (
            open ? (
              <ChevronDownIcon size={11} className="theme-muted-subtle" />
            ) : (
              <ChevronRightIcon size={11} className="theme-muted-subtle" />
            )
          ) : null}
        </span>
        <span className="flex w-4 shrink-0 items-center justify-center">
          {isDir ? (
            <FolderIcon open={open} size={14} className="theme-muted" />
          ) : (
            <RouteFileKindIcon kind={node.routeFileKind as RouteFileKind | undefined} size={14} />
          )}
        </span>
        <span className="min-w-0 truncate font-mono text-xs">{node.name}</span>
        {node.routeFileKind ? (
          <span className="theme-muted-subtle ml-auto shrink-0 text-[10px] uppercase">
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
