import Link from "next/link";
import { scanProject } from "@/lib/analyzer";
import { getExampleProjectPath } from "@/lib/example-project";
import { ScanIcon } from "@/components/icons";
import { StudioNav } from "@/components/layout/studio-nav";

export default function ScanPage() {
  const result = scanProject(getExampleProjectPath());

  if (!result.ok) {
    return (
      <div className="app-shell theme-shell flex overflow-hidden">
        <StudioNav />
        <div className="flex flex-1 items-center justify-center p-8 text-red-400">
          <div>
            <p>Scan failed: {result.error}</p>
            <Link href="/" className="mt-4 inline-block text-zinc-400 underline">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { project } = result;

  return (
    <div className="app-shell theme-shell flex overflow-hidden">
      <StudioNav nextVersion={project.nextVersion} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="theme-border shrink-0 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="theme-nav-active flex h-9 w-9 items-center justify-center rounded-lg">
              <ScanIcon size={18} />
            </span>
            <div>
              <p className="text-lg font-semibold">Analyzer debug</p>
              <p className="theme-muted text-sm">
                Scanning <code className="theme-text-secondary">examples/my-app</code>
              </p>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
            <section className="grid gap-4 sm:grid-cols-3">
              <Stat label="Project" value={project.name} />
              <Stat label="Next.js" value={project.nextVersion ?? "unknown"} />
              <Stat
                label="Gateway"
                value={project.proxy ? `${project.proxy.kind} (${project.proxy.path})` : "none"}
              />
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Routes ({project.routes.length})
              </h2>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-white/[0.03] text-zinc-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">URL</th>
                      <th className="px-4 py-2 font-medium">Rendering</th>
                      <th className="px-4 py-2 font-medium">Files</th>
                      <th className="px-4 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.routes.map((route) => (
                      <tr key={route.id} className="border-t border-white/5">
                        <td className="px-4 py-3 font-mono text-cyan-400">{route.urlPath}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              route.rendering === "dynamic"
                                ? "text-amber-400"
                                : route.rendering === "static"
                                  ? "text-emerald-400"
                                  : "text-zinc-400"
                            }
                          >
                            {route.rendering}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {route.files.map((f) => f.kind).join(", ")}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">
                          {route.cacheNotes.slice(0, 2).join(" · ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                File tree (app/)
              </h2>
              <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-400">
                {JSON.stringify(project.tree, null, 2)}
              </pre>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Raw JSON
              </h2>
              <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-500">
                {JSON.stringify(project, null, 2)}
              </pre>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}
