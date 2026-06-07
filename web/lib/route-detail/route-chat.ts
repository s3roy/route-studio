import type { RouteSegment } from "@/lib/analyzer";
import type { CacheLayer } from "@/lib/route-detail/cache-layers";
import type { RouteFaqItem } from "@/lib/route-detail/route-faq";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RouteChatInput = {
  question: string;
  route: RouteSegment;
  layers: CacheLayer[];
  faq: RouteFaqItem[];
  history?: ChatMessage[];
};

function buildSystemContext(input: Omit<RouteChatInput, "question" | "history">): string {
  const { route, layers, faq } = input;
  const layerSummary = layers.map((l) => `${l.name}: ${l.status} — ${l.description}`).join("\n");

  return [
    `You are Route Studio, an expert on Next.js App Router caching and rendering.`,
    `Answer concisely using the route analysis below. Be practical and specific to this route.`,
    ``,
    `Route: ${route.urlPath} (id: ${route.id})`,
    `Rendering: ${route.rendering}`,
    `RSC: ${route.isRSC ? "yes" : "no"}`,
    `Files: ${route.files.map((f) => `${f.kind}:${f.path}`).join(", ")}`,
    `Cache notes: ${route.cacheNotes.join("; ") || "none"}`,
    ``,
    `Cache layers:`,
    layerSummary,
    ``,
    `Known FAQ answers:`,
    ...faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`),
  ].join("\n");
}

function scoreFaqMatch(question: string, faqQuestion: string): number {
  const q = question.toLowerCase();
  const f = faqQuestion.toLowerCase();
  const qWords = q.split(/\W+/).filter((w) => w.length > 3);
  let score = 0;
  for (const word of qWords) {
    if (f.includes(word)) score++;
  }
  if (q.includes("data cache") && f.includes("data cache")) score += 3;
  if (q.includes("static") && f.includes("static")) score += 3;
  if (q.includes("dynamic") && f.includes("dynamic")) score += 3;
  return score;
}

function localAnswer(input: RouteChatInput): string {
  const { question, route, layers, faq } = input;
  const q = question.toLowerCase().trim();

  if (!q) {
    return "Ask a question about caching, rendering, or how to optimize this route.";
  }

  let bestFaq: RouteFaqItem | null = null;
  let bestScore = 0;
  for (const item of faq) {
    const score = scoreFaqMatch(q, item.question);
    if (score > bestScore) {
      bestScore = score;
      bestFaq = item;
    }
  }
  if (bestFaq && bestScore >= 2) {
    return bestFaq.answer;
  }

  if (/(static|ssg|prerender|build time)/.test(q)) {
    if (route.rendering === "static") {
      return `**${route.urlPath}** is already static. Keep avoiding cookies(), headers(), and fetch with cache: 'no-store' in this segment tree.`;
    }
    return `To make **${route.urlPath}** static, remove dynamic signals: ${route.cacheNotes.join(", ") || "force-dynamic"}. Use cached fetch with next.revalidate where possible.`;
  }

  if (/(dynamic|why.*slow|every request|ssr)/.test(q)) {
    if (route.rendering === "dynamic") {
      return `**${route.urlPath}** renders dynamically because: ${route.cacheNotes.join(" · ") || "Next.js detected runtime-only APIs"}. Each request re-executes server components in this tree.`;
    }
    return `**${route.urlPath}** is not forced dynamic right now (${route.rendering}). Nothing in the scan blocked static generation.`;
  }

  if (/(data cache|fetch|revalidate|no-store)/.test(q)) {
    const miss = route.cacheNotes.some((n) => n.includes("no-store") || n.includes("dynamic"));
    if (miss) {
      return `The Data Cache is bypassed on this route — typically due to fetch({ cache: 'no-store' }) or dynamic rendering. Layers: ${layers.map((l) => `${l.name}=${l.status}`).join(", ")}.`;
    }
    return `Fetch results can be cached in the Data Cache when you avoid no-store and dynamic APIs. This route's rendering mode is **${route.rendering}**.`;
  }

  if (/(rsc|server component|client component|use client)/.test(q)) {
    const page = route.files.find((f) => f.kind === "page");
    if (page?.isClientComponent) {
      return `The page at **${page.path}** is a Client Component ("use client"). It hydrates in the browser; parent layouts may still be RSC.`;
    }
    return `**${route.urlPath}** uses React Server Components by default${route.isRSC ? "" : " (with possible client islands in nested files)"}. Server components run on each request or at build time depending on cache mode.`;
  }

  if (/(full route cache|router cache|cdn|edge)/.test(q)) {
    return layers
      .map((l) => `**${l.name}** (${l.status}): ${l.description}`)
      .join("\n\n");
  }

  return [
    `Here's what I know about **${route.urlPath}**:`,
    `- Rendering: ${route.rendering}`,
    `- Cache signals: ${route.cacheNotes.join("; ") || "none detected"}`,
    `- Top layer: ${layers[0]?.name ?? "unknown"} is ${layers[0]?.status ?? "unknown"}`,
    ``,
    `Try asking about static vs dynamic rendering, Data Cache, or a specific cache layer.`,
  ].join("\n");
}

async function openAiAnswer(input: RouteChatInput, apiKey: string): Promise<string | null> {
  const system = buildSystemContext(input);
  const messages = [
    { role: "system" as const, content: system },
    ...(input.history ?? []).slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: input.question },
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 600,
        messages,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function answerRouteQuestion(input: RouteChatInput): Promise<{
  answer: string;
  provider: "openai" | "local";
}> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    const ai = await openAiAnswer(input, apiKey);
    if (ai) return { answer: ai, provider: "openai" };
  }

  return { answer: localAnswer(input), provider: "local" };
}
