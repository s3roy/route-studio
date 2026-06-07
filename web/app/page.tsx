import Link from "next/link";
import { routeDetailHref } from "@/lib/route-detail/urls";
import { DEMO_ROUTE_DETAIL, DEMO_ROUTES } from "@/lib/demo-routes";

const FEATURES = [
  {
    title: "Route graph",
    body: "Interactive React Flow canvas — layouts, pages, API routes, and loading UI wired together.",
  },
  {
    title: "File tree",
    body: "Browse the real app/ folder. Click any file to highlight it in the graph and insights panel.",
  },
  {
    title: "Cache autopsy",
    body: "Per-route breakdown of all four Next.js cache layers, with plain-English explanations.",
  },
  {
    title: "Suggested fixes",
    body: "See improved fetch() snippets when a route opts out of the Data Cache.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-sm font-semibold text-violet-300">
              RS
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">Route Studio</p>
              <p className="text-sm text-zinc-500">Next.js App Router visualizer</p>
            </div>
          </div>
          <Link
            href="/studio"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Open demo →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-medium text-violet-400">Open source · Next.js 16 · React Flow</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            See your App Router
            <span className="block text-violet-400">before you ship it</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            Route Studio statically scans <code className="text-zinc-300">app/</code> and renders an
            interactive route graph with RSC and cache-layer insights — built for developers learning
            the App Router.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/studio"
              className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Explore demo project
            </Link>
            <Link
              href={routeDetailHref(DEMO_ROUTE_DETAIL.id)}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5"
            >
              Route detail example ({DEMO_ROUTE_DETAIL.urlPath})
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Bundled demo — examples/my-app
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The live demo scans a sample Next.js app with nested layouts, route groups, dynamic
            rendering, proxy, and an API route.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {DEMO_ROUTES.map((route) => (
              <li key={route.urlPath}>
                <Link
                  href={routeDetailHref(route.id)}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm hover:border-violet-500/30"
                >
                  <span className="font-mono text-violet-300">{route.urlPath}</span>
                  <span className="text-sm text-zinc-500">{route.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Run locally
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-4 text-sm text-zinc-300">
              cd route-studio/web{"\n"}npm install{"\n"}npm run dev
            </pre>
          </div>
          <div className="rounded-xl border border-white/10 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Deploy
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Deploy the <code className="text-zinc-300">web/</code> directory to Vercel. The demo
              project ships inside <code className="text-zinc-300">web/examples/my-app</code>.
            </p>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              Deploy on Vercel →
            </a>
          </div>
        </section>

        <section className="mt-12 border-t border-white/10 pt-8">
          <p className="text-sm text-zinc-600">
            Similar tools:{" "}
            <a href="https://github.com/icydotdev/nextmap" className="text-zinc-500 hover:text-zinc-300">
              nextmap
            </a>
            ,{" "}
            <a href="https://github.com/yashkr321/troql" className="text-zinc-500 hover:text-zinc-300">
              troql
            </a>
            ,{" "}
            <a
              href="https://github.com/agentdmitro/Next-Inspector"
              className="text-zinc-500 hover:text-zinc-300"
            >
              Next-Inspector
            </a>
            . Route Studio focuses on fresher-friendly cache explanations in one web UI.
          </p>
        </section>
      </main>
    </div>
  );
}
