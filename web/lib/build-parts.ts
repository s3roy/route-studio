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
];
