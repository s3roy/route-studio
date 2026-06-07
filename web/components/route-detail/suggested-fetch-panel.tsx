"use client";

import { useState } from "react";
import type { SuggestedFetch } from "@/lib/route-detail/suggested-fetch";

type SuggestedFetchPanelProps = {
  suggestion: SuggestedFetch | null;
};

/** Mockup 02 — bottom-left suggested fetch snippet. */
export function SuggestedFetchPanel({ suggestion }: SuggestedFetchPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!suggestion) {
    return (
      <section className="rounded-lg border border-white/10 bg-[#121214] p-4">
        <p className="text-xs font-semibold text-zinc-200">Suggested fetch()</p>
        <p className="mt-1.5 text-[11px] text-zinc-500">
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
    <section className="flex h-full flex-col rounded-lg border border-white/10 bg-[#121214] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <span className="text-violet-400">✦</span>
            Suggested fetch()
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">{suggestion.reason}</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/5"
          title={suggestion.reason}
        >
          Why this?
        </button>
      </div>

      <pre className="mt-3 flex-1 overflow-auto rounded-md bg-black/50 p-3 text-[11px] leading-relaxed text-zinc-300">
        {suggestion.code}
      </pre>

      <button
        type="button"
        onClick={copyCode}
        className="mt-3 w-full rounded-md border border-white/10 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5"
      >
        {copied ? "Copied!" : "Copy code"}
      </button>
    </section>
  );
}
