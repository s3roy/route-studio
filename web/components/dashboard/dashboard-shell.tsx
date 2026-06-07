"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { RouteProject } from "@/lib/analyzer";
import {
  routeLinkQueryFromSource,
  type ProjectSource,
} from "@/lib/project-source";
import {
  loadStudioSession,
  restoreStudioProject,
  saveStudioSession,
} from "@/lib/studio-session";
import { copyShareUrl, createShareLink, studioShareHref } from "@/lib/share/build-share-url";
import {
  ChevronDownIcon,
  GitHubIcon,
  RouteStudioLogo,
  ShareIcon,
  UploadIcon,
} from "@/components/icons";
import { StudioNav } from "@/components/layout/studio-nav";
import { FileTree } from "./file-tree";
import { FolderUploadDialog } from "./folder-upload-dialog";
import { GitHubImportDialog } from "./github-import-dialog";
import { RouteGraph } from "./route-graph";
import { RouteInsights } from "./route-insights";
import { parseStudioPanel, type StudioPanel } from "@/lib/studio-nav";

type DashboardShellProps = {
  initialProject: RouteProject;
};

export function DashboardShell({ initialProject }: DashboardShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [source, setSource] = useState<ProjectSource>({ type: "demo" });
  const [importOpen, setImportOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);
  const [restoringSession, setRestoringSession] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<StudioPanel>(
    () => parseStudioPanel(searchParams.get("panel")) ?? "graph",
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(
    initialProject.routes.find((r) => r.urlPath === "/dashboard/settings")?.files.find((f) => f.kind === "page")
      ?.path ?? initialProject.routes[0]?.files[0]?.path ?? null,
  );

  useEffect(() => {
    const panel = parseStudioPanel(searchParams.get("panel"));
    if (panel) setMobilePanel(panel);
  }, [searchParams]);

  const selectPanel = useCallback(
    (panel: StudioPanel) => {
      setMobilePanel(panel);
      const params = new URLSearchParams(searchParams.toString());
      params.set("panel", panel);
      router.replace(`/studio?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const shareId = searchParams.get("share");
    if (shareId) {
      let cancelled = false;
      setLoadingShare(true);

      fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
        .then((res) => res.json())
        .then(
          (data: {
            ok: boolean;
            project?: RouteProject;
            selectedPath?: string;
            error?: string;
          }) => {
            if (cancelled || !data.ok || !data.project) return;
            const nextPath =
              data.selectedPath ?? data.project.routes[0]?.files[0]?.path ?? null;
            setProject(data.project);
            setSource({ type: "share", shareId });
            saveStudioSession({
              source: { type: "share", shareId },
              selectedPath: nextPath,
              project: data.project,
            });
            setSelectedPath(nextPath);
            setMobilePanel("graph");
          },
        )
        .finally(() => {
          if (!cancelled) {
            setLoadingShare(false);
            setSessionReady(true);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    const session = loadStudioSession();
    setSource(session.source);

    if (session.selectedPath) {
      setSelectedPath(session.selectedPath);
    }

    if (session.source.type === "demo") {
      setSessionReady(true);
      return;
    }

    let cancelled = false;
    setRestoringSession(true);

    void restoreStudioProject(session)
      .then((restored) => {
        if (cancelled || !restored) return;
        setProject(restored.project);
        setSelectedPath(
          restored.selectedPath ??
            restored.project.routes[0]?.files[0]?.path ??
            null,
        );
        saveStudioSession({
          source: session.source,
          selectedPath:
            restored.selectedPath ??
            session.selectedPath ??
            restored.project.routes[0]?.files[0]?.path ??
            null,
          project: restored.project,
        });
      })
      .finally(() => {
        if (!cancelled) {
          setRestoringSession(false);
          setSessionReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!sessionReady) return;
    saveStudioSession({
      source,
      selectedPath,
      project: source.type === "demo" ? undefined : project,
    });
  }, [sessionReady, source, selectedPath, project]);

  async function handleGitHubImportSuccess(data: { project: RouteProject; repoUrl: string }) {
    const nextSource: ProjectSource = { type: "github", url: data.repoUrl };
    const nextPath = data.project.routes[0]?.files[0]?.path ?? null;
    setProject(data.project);
    setSource(nextSource);
    saveStudioSession({
      source: nextSource,
      selectedPath: nextPath,
      project: data.project,
    });
    setSelectedPath(nextPath);
    setMobilePanel("graph");
  }

  function handleUploadSuccess(data: { project: RouteProject; projectName: string }) {
    const nextSource: ProjectSource = { type: "upload", name: data.projectName };
    const nextPath = data.project.routes[0]?.files[0]?.path ?? null;
    setProject(data.project);
    setSource(nextSource);
    saveStudioSession({
      source: nextSource,
      selectedPath: nextPath,
      project: data.project,
    });
    setSelectedPath(nextPath);
    setMobilePanel("graph");
  }

  function resetDemo() {
    const nextPath =
      initialProject.routes.find((r) => r.urlPath === "/dashboard/settings")?.files.find((f) => f.kind === "page")
        ?.path ?? null;
    setProject(initialProject);
    setSource({ type: "demo" });
    saveStudioSession({ source: { type: "demo" }, selectedPath: nextPath });
    setSelectedPath(nextPath);
  }

  async function shareDashboard() {
    const result = await createShareLink({ project, selectedPath });
    if (!result.ok) return;
    await copyShareUrl(studioShareHref(result.shareId));
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  const linkQuery = routeLinkQueryFromSource(source);
  const githubUrl = source.type === "github" ? source.url : null;

  return (
    <div className="app-shell theme-shell flex flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b theme-border px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href="/" className="hover:opacity-90">
            <RouteStudioLogo showWordmark />
          </Link>
          <ProjectPicker
            name={project.name}
            onResetDemo={resetDemo}
            source={source}
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="theme-border theme-hover theme-text-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
          >
            <UploadIcon size={14} />
            Upload folder
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="theme-border theme-hover theme-text-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
          >
            <GitHubIcon size={14} />
            Import from GitHub
          </button>
          <button
            type="button"
            onClick={() => void shareDashboard()}
            disabled={loadingShare}
            className="theme-border theme-hover theme-text-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            <ShareIcon size={14} />
            {shareCopied ? "Link copied" : "Share"}
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

      {loadingShare || restoringSession ? (
        <div className="shrink-0 border-b border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs text-violet-200">
          {loadingShare ? "Loading shared analysis…" : "Restoring your last project…"}
        </div>
      ) : null}

      {source.type === "github" ? (
        <div className="shrink-0 truncate border-b border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs text-violet-200">
          Scanning{" "}
          <a href={source.url} target="_blank" rel="noreferrer" className="underline">
            {source.url}
          </a>
        </div>
      ) : null}

      {source.type === "upload" ? (
        <div className="shrink-0 truncate border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs text-emerald-200">
          Local upload — {source.name}
        </div>
      ) : null}

      {source.type === "share" ? (
        <div className="shrink-0 truncate border-b border-sky-500/20 bg-sky-500/5 px-4 py-1.5 text-xs text-sky-200">
          Shared analysis · link expires in ~1 hour
        </div>
      ) : null}

      {/* Mobile panel tabs */}
      <div className="flex shrink-0 border-b theme-border lg:hidden">
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
            onClick={() => selectPanel(id)}
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
        <StudioNav nextVersion={project.nextVersion} />

        {/* File tree */}
        <aside
          className={`flex min-h-0 flex-col overflow-hidden border-r theme-border theme-panel ${
            mobilePanel === "tree" ? "flex w-full flex-1" : "hidden"
          } lg:flex lg:w-64 lg:shrink-0 lg:flex-none`}
        >
          <div className="shrink-0 border-b theme-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <p className="truncate text-xs font-medium">{project.name}</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <FileTree nodes={project.tree} selectedPath={selectedPath} onSelect={setSelectedPath} />
          </div>
        </aside>

        {/* Graph — center column */}
        <section
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden theme-canvas ${
            mobilePanel === "graph" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b theme-border px-3 py-2">
            <p className="theme-muted text-[10px] font-semibold uppercase tracking-wider">
              Route graph
            </p>
            <p className="theme-muted-subtle text-[10px]">Pan · zoom · export · click a node</p>
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
          className={`flex min-h-0 flex-col overflow-hidden border-l theme-border theme-panel ${
            mobilePanel === "insights" ? "flex w-full flex-1" : "hidden"
          } lg:flex lg:w-[300px] lg:shrink-0 lg:flex-none`}
        >
          <RouteInsights project={project} selectedPath={selectedPath} linkQuery={linkQuery} />
        </aside>
      </div>

      <GitHubImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleGitHubImportSuccess}
      />
      <FolderUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

function ProjectPicker({
  name,
  onResetDemo,
  source,
}: {
  name: string;
  onResetDemo: () => void;
  source: ProjectSource;
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
        className="theme-border theme-subtle theme-text-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
      >
        {name}
        <ChevronDownIcon size={14} className="theme-muted-subtle" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="theme-card theme-border absolute left-0 z-20 mt-1 min-w-[220px] rounded-lg border py-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                onResetDemo();
                setOpen(false);
              }}
              className="theme-text-tertiary theme-hover block w-full px-3 py-2 text-left text-sm"
            >
              examples/my-app (demo)
            </button>
            {source.type === "github" ? (
              <p className="border-t theme-border px-3 py-2 text-sm text-violet-300">
                GitHub import active
              </p>
            ) : null}
            {source.type === "upload" ? (
              <p className="border-t theme-border px-3 py-2 text-sm text-emerald-300">
                Local upload active
              </p>
            ) : null}
            {source.type === "share" ? (
              <p className="border-t theme-border px-3 py-2 text-sm text-sky-300">
                Shared link active
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
