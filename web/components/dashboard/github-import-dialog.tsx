"use client";

import { useState } from "react";
import type { RouteProject } from "@/lib/analyzer";

type GitHubImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: { project: RouteProject; repoUrl: string }) => void;
};

export function GitHubImportDialog({ open, onClose, onSuccess }: GitHubImportDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const res = await fetch("/api/import/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as
        | { ok: true; project: RouteProject; repoUrl: string }
        | { ok: false; error: string; suggestions?: string[] };

      if (!data.ok) {
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

  function useSuggestion(suggestionUrl: string) {
    setUrl(suggestionUrl);
    setError(null);
    setSuggestions([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-labelledby="github-import-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl"
      >
        <h2 id="github-import-title" className="text-base font-semibold">
          Import from GitHub
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Paste a public repo URL. For monorepos, include the app subfolder — e.g.{" "}
          <code className="text-zinc-300">…/tree/canary/examples/hello-world</code>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/tree/main/apps/web"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
            autoFocus
            disabled={loading}
          />

          {error ? (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error.split("\n").map((line) => (
                <p key={line} className={line.startsWith("•") ? "mt-1 font-mono text-xs" : ""}>
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="text-xs font-medium text-zinc-400">Suggested app folders — click to use:</p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => useSuggestion(s)}
                      className="w-full truncate rounded px-2 py-1.5 text-left font-mono text-xs text-violet-300 hover:bg-white/5"
                    >
                      {s.replace("https://github.com/", "")}
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
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
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
