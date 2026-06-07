"use client";

import { useRef, useState } from "react";
import { SparklesIcon } from "@/components/icons";
import type { RouteSegment } from "@/lib/analyzer";
import type { CacheLayer } from "@/lib/route-detail/cache-layers";
import type { ChatMessage } from "@/lib/route-detail/route-chat";
import type { RouteFaqItem } from "@/lib/route-detail/route-faq";

type RouteFaqPanelProps = {
  route: RouteSegment;
  layers: CacheLayer[];
  items: RouteFaqItem[];
};

/** Mockup 02 — interactive route chat with FAQ shortcuts. */
export function RouteFaqPanel({ route, layers, items }: RouteFaqPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<"openai" | "local" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function sendQuestion(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    setQuery("");
    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/route/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          route,
          layers,
          faq: items,
          history: messages,
        }),
      });
      const data = (await res.json()) as
        | { ok: true; answer: string; provider: "openai" | "local" }
        | { ok: false; error: string };

      if (!data.ok) {
        setMessages([
          ...nextHistory,
          { role: "assistant", content: data.error || "Something went wrong." },
        ]);
        return;
      }

      setProvider(data.provider);
      setMessages([...nextHistory, { role: "assistant", content: data.answer }]);
      window.setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch {
      setMessages([
        ...nextHistory,
        { role: "assistant", content: "Could not reach the chat service. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="theme-card theme-border flex h-full min-h-[320px] flex-col rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <SparklesIcon size={14} className="text-violet-600" />
        <p className="theme-text-secondary text-xs font-semibold">Ask about this route</p>
        <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-700">
          {provider === "openai" ? "AI" : "Beta"}
        </span>
      </div>
      <p className="theme-muted mt-1.5 text-[11px] leading-relaxed">
        Chat about caching, performance, and optimization for{" "}
        <span className="theme-text-tertiary font-mono">{route.urlPath}</span>.
      </p>

      <div ref={listRef} className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.question}>
                <button
                  type="button"
                  onClick={() => sendQuestion(item.question)}
                  disabled={loading}
                  className="theme-border theme-input theme-hover theme-text-secondary flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs disabled:opacity-50"
                >
                  <span>{item.question}</span>
                  <span className="theme-muted-subtle">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={`rounded-md px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === "user"
                  ? "chat-user-bubble rounded-md px-3 py-2"
                  : "theme-subtle theme-text-secondary mr-2 rounded-md border theme-border px-3 py-2"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading ? (
          <p className="theme-muted text-[11px]">Thinking about {route.urlPath}…</p>
        ) : null}
      </div>

      <form
        className="mt-auto pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void sendQuestion(query);
        }}
      >
        <div className="theme-border theme-input flex items-center gap-2 rounded-md border px-3 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about this route…"
            className="theme-text-secondary placeholder:theme-muted-subtle flex-1 bg-transparent text-xs outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="text-violet-600 hover:text-violet-700 disabled:opacity-40"
            aria-label="Send"
          >
            →
          </button>
        </div>
        <p className="theme-muted-subtle mt-2 text-center text-[10px]">
          {provider === "openai"
            ? "Powered by OpenAI · verify important changes in docs."
            : "Local analysis · set OPENAI_API_KEY for full AI chat."}
        </p>
      </form>
    </section>
  );
}
