"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { RouteNodeData } from "@/lib/graph/build-graph";

const kindStyles: Record<
  RouteNodeData["nodeKind"],
  { border: string; glow: string; icon: string }
> = {
  layout: {
    border: "border-violet-500/50",
    glow: "shadow-violet-500/10",
    icon: "◫",
  },
  page: {
    border: "border-teal-500/50",
    glow: "shadow-teal-500/10",
    icon: "◧",
  },
  route: {
    border: "border-amber-500/50",
    glow: "shadow-amber-500/10",
    icon: "{ }",
  },
  loading: {
    border: "border-zinc-500/50",
    glow: "shadow-zinc-500/10",
    icon: "◌",
  },
};

export function RouteFlowNode({ data, selected }: NodeProps<Node<RouteNodeData>>) {
  const style = kindStyles[data.nodeKind];

  return (
    <div
      className={`min-w-[176px] max-w-[200px] rounded-lg border bg-zinc-900/95 px-2.5 py-2 shadow-md ${style.border} ${style.glow} ${
        selected ? "ring-2 ring-violet-400/70" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!border-violet-400 !bg-violet-400" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            <span className="text-zinc-500">{style.icon}</span>
            {data.label}
          </p>
          <p className="mt-0.5 line-clamp-1 font-mono text-[11px] text-zinc-100">{data.sublabel}</p>
          <p className="mt-0.5 line-clamp-2 break-all font-mono text-[10px] leading-snug text-zinc-500">
            {data.filePath}
          </p>
        </div>
        {data.tag ? (
          <span className="shrink-0 rounded bg-white/5 px-1 py-0.5 text-[9px] font-medium text-zinc-300">
            {data.tag}
          </span>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!border-violet-400 !bg-violet-400" />
    </div>
  );
}
