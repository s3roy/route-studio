"use client";

import { useState } from "react";
import { SparklesIcon } from "@/components/icons";
import type { SuggestedFetch } from "@/lib/route-detail/suggested-fetch";

type SuggestedFetchPanelProps = {
  suggestion: SuggestedFetch | null;
};

/** Mockup 02 — bottom-left suggested fetch snippet. */
export function SuggestedFetchPanel({ suggestion }: SuggestedFetchPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!suggestion) {
    return (
      <section className="theme-card theme-border rounded-lg border p-4">
        <p className="theme-text-secondary text-xs font-semibold">Suggested fetch()</p>
        <p className="theme-muted mt-1.5 text-[11px]">
          No fetch() call detected in this route — nothing to optimize yet.
        </p>
      </section>
    );
  }

  async function copyCode() {
    await navigator.clipboard.writeText(suggestion!.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="theme-card theme-border flex h-full flex-col rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="theme-text-secondary flex items-center gap-2 text-xs font-semibold">
            <SparklesIcon size={14} className="text-violet-600" />
            Suggested fetch()
          </p>
          <p className="theme-muted mt-1 text-[11px]">{suggestion.reason}</p>
        </div>
        <button
          type="button"
          className="theme-border theme-hover theme-muted shrink-0 rounded border px-2 py-1 text-[11px]"
          title={suggestion.reason}
        >
          Why this?
        </button>
      </div>

      <pre className="theme-code mt-3 flex-1 overflow-auto rounded-md p-3 text-[11px] leading-relaxed">
        {suggestion.code}
      </pre>

      <button
        type="button"
        onClick={copyCode}
        className="theme-border theme-hover theme-text-secondary mt-3 w-full rounded-md border py-2 text-xs font-medium"
      >
        {copied ? "Copied!" : "Copy code"}
      </button>
    </section>
  );
}
