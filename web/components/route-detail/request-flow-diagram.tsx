import type { RouteProject, RouteSegment } from "@/lib/analyzer";

type RequestFlowDiagramProps = {
  project: RouteProject;
  route: RouteSegment;
  layoutChain: string[];
};

export function RequestFlowDiagram({ project, route, layoutChain }: RequestFlowDiagramProps) {
  const pageFile = route.files.find((f) => f.kind === "page");
  const apiFile = route.files.find((f) => f.kind === "route");
  const hasClient = route.hasClientBoundary;

  const steps: FlowStep[] = [
    {
      title: "Browser",
      subtitle: "User initiates navigation",
      tone: "neutral",
    },
  ];

  if (project.proxy) {
    steps.push({
      title: project.proxy.kind === "proxy" ? "Proxy" : "Middleware",
      subtitle: `${project.proxy.path} — auth & redirects`,
      tone: "gateway",
    });
  }

  for (const layoutPath of layoutChain) {
    steps.push({
      title: "Layout (RSC)",
      subtitle: layoutPath,
      tone: "rsc",
    });
  }

  if (pageFile) {
    steps.push({
      title: route.isRSC ? "Page (RSC)" : "Page",
      subtitle: pageFile.path,
      tone: "page",
    });
  } else if (apiFile) {
    steps.push({
      title: "Route handler",
      subtitle: apiFile.path,
      tone: "page",
    });
  }

  if (hasClient) {
    steps.push({
      title: "Client boundary",
      subtitle: '"use client" — interactive widgets',
      tone: "client",
    });
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#121214] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-zinc-200">Request flow</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">One navigation through the App Router pipeline</p>
        </div>
        {pageFile ? (
          <code className="hidden rounded bg-black/40 px-2 py-1 text-[11px] text-zinc-400 sm:inline">
            Open in editor
          </code>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-2">
          {steps.map((step, index) => (
            <div key={`${step.title}-${index}`} className="flex items-center gap-2">
              <FlowNode step={step} />
              {index < steps.length - 1 ? <FlowArrow dashed={step.tone === "client"} /> : null}
            </div>
          ))}
        </div>
      </div>

      {(pageFile || layoutChain.length > 0) && !apiFile ? (
        <p className="mt-4 text-center text-[11px] text-zinc-600">
          RSC payload streamed to the client
          {hasClient ? " · hydrates at client boundary" : ""}
        </p>
      ) : null}
    </section>
  );
}

type FlowTone = "neutral" | "gateway" | "rsc" | "page" | "client";

type FlowStep = {
  title: string;
  subtitle: string;
  tone: FlowTone;
};

function FlowNode({ step }: { step: FlowStep }) {
  const styles: Record<FlowTone, string> = {
    neutral: "border-zinc-600 bg-zinc-900/80",
    gateway: "border-amber-500/40 bg-amber-500/5",
    rsc: "border-violet-500/40 bg-violet-500/5",
    page: "border-teal-500/40 bg-teal-500/5",
    client: "border-dashed border-violet-400/50 bg-violet-500/5",
  };

  return (
    <div className={`w-40 rounded-lg border px-3 py-2.5 ${styles[step.tone]}`}>
      <p className="text-xs font-semibold text-zinc-200">{step.title}</p>
      <p className="mt-1 line-clamp-2 font-mono text-[11px] leading-snug text-zinc-500">
        {step.subtitle}
      </p>
    </div>
  );
}

function FlowArrow({ dashed }: { dashed?: boolean }) {
  return (
    <div className="flex w-8 items-center">
      <div
        className={`h-px w-full ${dashed ? "border-t border-dashed border-violet-400/50" : "bg-zinc-600"}`}
      />
      <span className="text-zinc-600">›</span>
    </div>
  );
}
