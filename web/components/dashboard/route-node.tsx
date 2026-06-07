"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { RouteNodeData } from "@/lib/graph/build-graph";
import {
  ApiRouteIcon,
  LayoutIcon,
  LoadingIcon,
  PageIcon,
} from "@/components/icons";

const kindStyles: Record<
  RouteNodeData["nodeKind"],
  { border: string; icon: string; Icon: typeof LayoutIcon }
> = {
  layout: {
    border: "border-violet-500/50",
    icon: "text-violet-400",
    Icon: LayoutIcon,
  },
  page: {
    border: "border-teal-500/50",
    icon: "text-teal-400",
    Icon: PageIcon,
  },
  route: {
    border: "border-amber-500/50",
    icon: "text-amber-400",
    Icon: ApiRouteIcon,
  },
  loading: {
    border: "border-zinc-500/50",
    icon: "theme-muted",
    Icon: LoadingIcon,
  },
};

export function RouteFlowNode({ data, selected }: NodeProps<Node<RouteNodeData>>) {
  const style = kindStyles[data.nodeKind];
  const Icon = style.Icon;

  return (
    <div
      className={`theme-graph-node min-w-[176px] max-w-[200px] rounded-lg border px-2.5 py-2 ${style.border} ${
        selected ? "ring-2 ring-violet-400/70" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!border-violet-500 !bg-violet-500" />
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-black/10 ${style.border}`}
        >
          <Icon size={14} className={style.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <p className="theme-text-secondary text-[10px] font-semibold uppercase tracking-wide">
              {data.label}
            </p>
            {data.tag ? (
              <span className="theme-subtle theme-text-tertiary shrink-0 rounded px-1 py-0.5 text-[9px] font-medium">
                {data.tag}
              </span>
            ) : null}
          </div>
          <p className="theme-text mt-0.5 line-clamp-1 font-mono text-[11px] font-medium">
            {data.sublabel}
          </p>
          <p className="theme-muted mt-0.5 line-clamp-2 break-all font-mono text-[10px] leading-snug">
            {data.filePath}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!border-violet-500 !bg-violet-500" />
    </div>
  );
}
