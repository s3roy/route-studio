export type BuildPartStatus = "done" | "current" | "pending";

export type BuildPart = {
  id: number;
  title: string;
  summary: string;
  status: BuildPartStatus;
};

/** Roadmap shown on the home page — update status as we ship each part. */
export const BUILD_PARTS: BuildPart[] = [
  {
    id: 1,
    title: "Project setup",
    summary: "Next.js app, dark shell, folder structure for analyzer + UI.",
    status: "done",
  },
  {
    id: 2,
    title: "Analyzer — scan app/",
    summary: "Read folder tree, map routes, detect page/layout/loading/route files.",
    status: "done",
  },
  {
    id: 3,
    title: "Dashboard UI",
    summary: "File tree + React Flow graph + quick insights panel (mockup 01).",
    status: "done",
  },
  {
    id: 4,
    title: "Route detail page",
    summary: "Cache layers, request flow, metadata (mockup 02).",
    status: "done",
  },
  {
    id: 5,
    title: "Sample app + polish",
    summary: "examples/my-app demo, suggested fetch snippets, deploy to Vercel.",
    status: "done",
  },
  {
    id: 6,
    title: "Upload local folder",
    summary: "Drag & drop or pick a project folder — scans app/ without executing code.",
    status: "done",
  },
  {
    id: 7,
    title: "Ask about this route",
    summary: "Real chat UI with route context; OpenAI when OPENAI_API_KEY is set.",
    status: "done",
  },
  {
    id: 8,
    title: "Export graph",
    summary: "Download the route graph as PNG or SVG from the dashboard.",
    status: "done",
  },
  {
    id: 9,
    title: "Share link",
    summary: "Copy a shareable URL for dashboard or route detail analysis (~1 hour TTL).",
    status: "done",
  },
  {
    id: 10,
    title: "Theme toggle",
    summary: "Switch between dark and light mode from the header or nav bar.",
    status: "done",
  },
];
