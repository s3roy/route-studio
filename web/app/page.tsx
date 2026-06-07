import Link from "next/link";
import { routeDetailHref } from "@/lib/route-detail/urls";
import { DEMO_ROUTE_DETAIL, DEMO_ROUTES } from "@/lib/demo-routes";
import { HomeHeader } from "@/components/home/home-header";

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
    <div className="theme-shell min-h-screen">
      <HomeHeader />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-medium text-violet-500">Open source · Next.js 16 · React Flow</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            See your App Router
            <span className="block text-violet-500">before you ship it</span>
          </h1>
          <p className="theme-muted mx-auto mt-5 max-w-2xl text-lg">
            Route Studio statically scans <code className="theme-text-tertiary">app/</code> and renders an
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
              className="theme-border theme-hover theme-text-tertiary rounded-xl border px-6 py-3 text-sm font-medium"
            >
              Route detail example ({DEMO_ROUTE_DETAIL.urlPath})
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="theme-card theme-border rounded-xl border p-5">
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="theme-muted mt-2 text-sm leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="theme-card theme-border mt-16 rounded-xl border p-6">
          <h2 className="theme-muted text-sm font-semibold uppercase tracking-wider">
            Bundled demo — examples/my-app
          </h2>
          <p className="theme-muted mt-2 text-sm">
            The live demo scans a sample Next.js app with nested layouts, route groups, dynamic
            rendering, proxy, and an API route.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {DEMO_ROUTES.map((route) => (
              <li key={route.urlPath}>
                <Link
                  href={routeDetailHref(route.id)}
                  className="theme-border theme-input theme-hover flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:border-violet-500/30"
                >
                  <span className="font-mono text-violet-600">{route.urlPath}</span>
                  <span className="theme-muted-subtle text-sm">{route.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="theme-card theme-border rounded-xl border p-5">
            <h2 className="theme-muted text-sm font-semibold uppercase tracking-wider">
              Run locally
            </h2>
            <pre className="theme-input theme-text-tertiary mt-3 overflow-x-auto rounded-lg p-4 text-sm">
              cd route-studio/web{"\n"}npm install{"\n"}npm run dev
            </pre>
          </div>
          <div className="theme-card theme-border rounded-xl border p-5">
            <h2 className="theme-muted text-sm font-semibold uppercase tracking-wider">
              Deploy
            </h2>
            <p className="theme-muted mt-2 text-sm">
              Deploy the <code className="theme-text-tertiary">web/</code> directory to Vercel. The demo
              project ships inside <code className="theme-text-tertiary">web/examples/my-app</code>.
            </p>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="theme-border theme-hover theme-text-tertiary mt-4 inline-flex rounded-lg border px-4 py-2 text-sm"
            >
              Deploy on Vercel →
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
