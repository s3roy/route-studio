"use client";

import { useState } from "react";
import type { RouteFaqItem } from "@/lib/route-detail/route-faq";

type RouteFaqPanelProps = {
  items: RouteFaqItem[];
};

/** Mockup 02 — bottom-right FAQ / future AI panel. */
export function RouteFaqPanel({ items }: RouteFaqPanelProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [query, setQuery] = useState("");

  return (
    <section className="flex h-full flex-col rounded-lg border border-white/10 bg-[#121214] p-4">
      <div className="flex items-center gap-2">
        <span className="text-violet-400">✦</span>
        <p className="text-xs font-semibold text-zinc-200">Ask about this route</p>
        <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-300">
          Beta
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
        Get insights about caching, performance, and optimization for this route.
      </p>

      <ul className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-white/8 bg-black/20 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/[0.03]"
            >
              <span>{item.question}</span>
              <span className="text-zinc-600">›</span>
            </button>
            {openIndex === index ? (
              <p className="mt-2 rounded-md bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
                {item.answer}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about this route…"
            className="flex-1 bg-transparent text-xs text-zinc-300 outline-none placeholder:text-zinc-600"
            disabled
          />
          <span className="text-violet-500">→</span>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-600">AI responses may be inaccurate.</p>
      </div>
    </section>
  );
}
