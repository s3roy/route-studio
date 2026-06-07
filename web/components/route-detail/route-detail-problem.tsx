import Link from "next/link";
import type { RouteProject } from "@/lib/analyzer";
import { routeDetailHref } from "@/lib/route-detail/urls";
import { StudioNav } from "@/components/layout/studio-nav";

type RouteDetailProblemProps = {
  title: string;
  message: string;
  github?: string | null;
  share?: string | null;
  project?: RouteProject;
  suggestions?: string[];
};

export function RouteDetailProblem({
  title,
  message,
  github = null,
  share = null,
  project,
  suggestions = [],
}: RouteDetailProblemProps) {
  const query = { github, share };

  return (
    <div className="app-shell theme-shell flex flex-col overflow-hidden">
      <header className="theme-border flex shrink-0 items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold">Route detail</p>
        <Link href="/studio" className="text-sm text-violet-600 hover:text-violet-700">
          ← Back to studio
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <StudioNav nextVersion={project?.nextVersion} />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div className="theme-card theme-border max-w-xl rounded-xl border p-5">
            <h1 className="theme-text text-base font-semibold">{title}</h1>
            <p className="theme-muted mt-2 text-sm leading-relaxed">{message}</p>

            {project && project.routes.length > 0 ? (
              <div className="mt-4">
                <p className="theme-muted text-xs font-medium">Routes in this project:</p>
                <ul className="mt-2 space-y-1">
                  {project.routes.slice(0, 12).map((route) => (
                    <li key={route.id}>
                      <Link
                        href={routeDetailHref(route.id, query)}
                        className="font-mono text-xs text-violet-600 hover:text-violet-700"
                      >
                        {route.urlPath}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggestions.length > 0 ? (
              <div className="mt-4">
                <p className="theme-muted text-xs font-medium">Try importing a subfolder:</p>
                <ul className="mt-2 space-y-1">
                  {suggestions.slice(0, 6).map((url) => (
                    <li key={url}>
                      <span className="block truncate font-mono text-xs text-violet-600">{url}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
