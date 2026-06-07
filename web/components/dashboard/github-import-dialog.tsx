"use client";

import { useState } from "react";
import type { RouteProject } from "@/lib/analyzer";

type GitHubImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: { project: RouteProject; repoUrl: string }) => void;
};

type ImportResponse =
  | { ok: true; project: RouteProject; repoUrl: string }
  | { ok: false; error: string; suggestions?: string[] };

export function GitHubImportDialog({ open, onClose, onSuccess }: GitHubImportDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  if (!open) return null;

  async function runImport(importUrl: string) {
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const res = await fetch("/api/import/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = (await res.json()) as ImportResponse;

      if (!data.ok) {
        setUrl(importUrl.trim());
        setError(data.error);
        setSuggestions(data.suggestions ?? []);
        return;
      }

      setUrl("");
      onSuccess({ project: data.project, repoUrl: data.repoUrl });
      onClose();
    } catch {
      setError("Import failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runImport(url);
  }

  function shortLabel(suggestionUrl: string): string {
    return suggestionUrl.replace(/^https:\/\/github\.com\//, "");
  }

  return (
    <div className="theme-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-labelledby="github-import-title"
        className="theme-card theme-border max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-xl"
      >
        <h2 id="github-import-title" className="theme-text text-base font-semibold">
          Import from GitHub
        </h2>
        <p className="theme-muted mt-2 text-sm">
          Paste a public repo URL. Monorepos need the app subfolder — e.g.{" "}
          <code className="theme-text-secondary">…/tree/main/apps/web</code> or{" "}
          <code className="theme-text-secondary">…/tree/canary/examples/hello-world</code>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/tree/main/apps/web"
            className="theme-border theme-input theme-text placeholder:theme-muted-subtle w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-violet-500/50"
            autoFocus
            disabled={loading}
          />

          {error ? (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <p>{error.split("\n")[0]}</p>
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="theme-border theme-subtle rounded-lg border p-3">
              <p className="theme-muted text-xs font-medium">
                Next.js apps found in this repo — click to import:
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void runImport(s)}
                      className="theme-hover flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left disabled:opacity-50"
                    >
                      <span className="min-w-0 truncate font-mono text-xs text-violet-700">
                        {shortLabel(s)}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-violet-500">
                        Import
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="theme-border theme-hover theme-text-secondary rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Scanning…" : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
