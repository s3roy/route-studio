"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RouteProject } from "@/lib/analyzer";
import { saveProjectSource, type ProjectSource } from "@/lib/project-source";
import { StudioNav } from "@/components/layout/studio-nav";
import { FileTree } from "./file-tree";
import { GitHubImportDialog } from "./github-import-dialog";
import { RouteGraph } from "./route-graph";
import { RouteInsights } from "./route-insights";

type DashboardShellProps = {
  initialProject: RouteProject;
};

type MobilePanel = "tree" | "graph" | "insights";

export function DashboardShell({ initialProject }: DashboardShellProps) {
  const [project, setProject] = useState(initialProject);
  const [source, setSource] = useState<ProjectSource>({ type: "demo" });
  const [importOpen, setImportOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("graph");
  const [selectedPath, setSelectedPath] = useState<string | null>(
    initialProject.routes.find((r) => r.urlPath === "/dashboard/settings")?.files.find((f) => f.kind === "page")
      ?.path ?? initialProject.routes[0]?.files[0]?.path ?? null,
  );

  async function handleGitHubImportSuccess(data: { project: RouteProject; repoUrl: string }) {
    const nextSource: ProjectSource = { type: "github", url: data.repoUrl };
    setProject(data.project);
    setSource(nextSource);
    saveProjectSource(nextSource);
    setSelectedPath(data.project.routes[0]?.files[0]?.path ?? null);
    setMobilePanel("graph");
  }

  function resetDemo() {
    setProject(initialProject);
    setSource({ type: "demo" });
    saveProjectSource({ type: "demo" });
    setSelectedPath(
      initialProject.routes.find((r) => r.urlPath === "/dashboard/settings")?.files.find((f) => f.kind === "page")
        ?.path ?? null,
    );
  }

  const githubUrl = source.type === "github" ? source.url : null;

  return (
    <div className="app-shell flex flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div>
            <p className="text-sm font-semibold leading-tight">Route Studio</p>
            <p className="text-xs text-zinc-500">App Router visualizer</p>
          </div>
          <ProjectPicker name={project.name} onResetDemo={resetDemo} githubActive={source.type === "github"} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            Import from GitHub
          </button>
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            Deploy on Vercel
          </a>
        </div>
      </header>

      {source.type === "github" ? (
        <div className="shrink-0 truncate border-b border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs text-violet-200">
          Scanning{" "}
          <a href={source.url} target="_blank" rel="noreferrer" className="underline">
            {source.url}
          </a>
        </div>
      ) : null}

      {/* Mobile panel tabs */}
      <div className="flex shrink-0 border-b border-white/10 lg:hidden">
        {(
          [
            ["tree", "Files"],
            ["graph", "Graph"],
            ["insights", "Insights"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobilePanel(id)}
            className={`flex-1 py-2 text-xs font-medium ${
              mobilePanel === id
                ? "border-b-2 border-violet-500 text-violet-200"
                : "text-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <StudioNav />

        {/* File tree */}
        <aside
          className={`flex min-h-0 flex-col overflow-hidden border-r border-white/10 bg-zinc-950 ${
            mobilePanel === "tree" ? "flex w-full flex-1" : "hidden"
          } lg:flex lg:w-64 lg:shrink-0 lg:flex-none`}
        >
          <div className="shrink-0 border-b border-white/10 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              File explorer
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <FileTree nodes={project.tree} selectedPath={selectedPath} onSelect={setSelectedPath} />
          </div>
          <div className="shrink-0 border-t border-white/10 px-3 py-1.5 text-xs text-zinc-500">
            Next.js {project.nextVersion ?? "unknown"}
          </div>
        </aside>

        {/* Graph — center column */}
        <section
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0c0c0f] ${
            mobilePanel === "graph" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Route graph
            </p>
            <p className="text-[10px] text-zinc-600">Pan · zoom · click a node</p>
          </div>
          <div className="relative min-h-0 flex-1">
            <RouteGraph
              project={project}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </div>
        </section>

        {/* Insights */}
        <aside
          className={`flex min-h-0 flex-col overflow-hidden border-l border-white/10 bg-zinc-950 ${
            mobilePanel === "insights" ? "flex w-full flex-1" : "hidden"
          } lg:flex lg:w-[300px] lg:shrink-0 lg:flex-none`}
        >
          <RouteInsights project={project} selectedPath={selectedPath} githubUrl={githubUrl} />
        </aside>
      </div>

      <GitHubImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleGitHubImportSuccess}
      />
    </div>
  );
}

function ProjectPicker({
  name,
  onResetDemo,
  githubActive,
}: {
  name: string;
  onResetDemo: () => void;
  githubActive: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300"
      >
        {name} ▾
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 z-20 mt-1 min-w-[220px] rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                onResetDemo();
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5"
            >
              examples/my-app (demo)
            </button>
            {githubActive ? (
              <p className="border-t border-white/10 px-3 py-2 text-sm text-violet-300">
                GitHub import active
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
