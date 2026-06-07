"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useNodesInitialized,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { RouteProject } from "@/lib/analyzer";
import { buildRouteGraph, type RouteNodeData } from "@/lib/graph/build-graph";
import { RouteFlowNode } from "./route-node";

const nodeTypes = { routeNode: RouteFlowNode };

const FIT_VIEW_OPTIONS = {
  padding: 0.35,
  maxZoom: 1,
  duration: 250,
} as const;

type RouteGraphProps = {
  project: RouteProject;
  selectedPath: string | null;
  onSelect: (path: string) => void;
};

export function RouteGraph({ project, selectedPath, onSelect }: RouteGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graph = useMemo(() => buildRouteGraph(project), [project]);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as RouteNodeData;
      onSelect(data.filePath);
    },
    [onSelect],
  );

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === selectedPath,
      })),
    [nodes, selectedPath],
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-medium text-zinc-300">No route graph</p>
          <p className="mt-1 text-xs text-zinc-500">
            Could not find <code className="text-zinc-400">app/layout.tsx</code> in this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="graph-canvas absolute inset-0 min-h-[200px]">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        minZoom={0.2}
        maxZoom={1.25}
        fitViewOptions={FIT_VIEW_OPTIONS}
        proOptions={{ hideAttribution: true }}
      >
        <GraphViewportSync project={project} />
        <Background color="#27272a" gap={24} size={1} />
        <Controls
          showInteractive={false}
          showFitView
          position="top-left"
          className="graph-controls"
          fitViewOptions={FIT_VIEW_OPTIONS}
        />
        <Panel position="top-right" className="graph-panel-controls !m-3">
          <div className="flex flex-col gap-2">
            <FitViewButton />
            <FullscreenButton containerRef={containerRef} />
          </div>
        </Panel>
        <Panel position="bottom-left" className="!m-3">
          <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-zinc-900/95 px-2.5 py-1.5 text-xs text-zinc-400 shadow-lg">
            <LegendItem color="#a855f7" label="Layout" />
            <LegendItem color="#14b8a6" label="Page / API" />
            <LegendItem color="#a855f7" dashed label="Route group" />
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

function useFitGraphView() {
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  return useCallback(() => {
    if (!nodesInitialized) return;
    void fitView(FIT_VIEW_OPTIONS);
  }, [fitView, nodesInitialized]);
}

function GraphViewportSync({ project }: { project: RouteProject }) {
  const fitGraph = useFitGraphView();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (!nodesInitialized) return;

    const id = window.setTimeout(() => {
      fitGraph();
    }, 50);

    return () => window.clearTimeout(id);
  }, [project, nodesInitialized, fitGraph]);

  return null;
}

function FitViewButton() {
  const fitGraph = useFitGraphView();

  return (
    <button
      type="button"
      onClick={fitGraph}
      className="rounded-lg border border-white/10 bg-zinc-900/95 px-2.5 py-1 text-xs text-zinc-300 shadow-lg hover:bg-zinc-800"
    >
      Fit to view
    </button>
  );
}

function FullscreenButton({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const fitGraph = useFitGraphView();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function sync() {
      const active = document.fullscreenElement === containerRef.current;
      setIsFullscreen(active);
      if (active) {
        window.setTimeout(() => fitGraph(), 100);
      }
    }

    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [containerRef, fitGraph]);

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        await el.requestFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Browser blocked fullscreen (needs user gesture — click handler satisfies this)
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="rounded-lg border border-white/10 bg-zinc-900/95 px-2.5 py-1 text-xs text-zinc-300 shadow-lg hover:bg-zinc-800"
      title={isFullscreen ? "Exit fullscreen" : "Fullscreen graph"}
    >
      {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
    </button>
  );
}

function LegendItem({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="inline-block h-0.5 w-5 shrink-0"
        style={{
          background: dashed ? "transparent" : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}
