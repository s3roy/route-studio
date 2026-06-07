# Route Studio — Web App

Next.js 16 application that powers Route Studio. Deploy **this folder** to Vercel.

For the full project overview, see the [root README](../README.md).

---

## Scripts

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

---

## App routes

| Path | File | Description |
|------|------|-------------|
| `/` | `app/page.tsx` | Landing page with feature grid + demo links |
| `/studio` | `app/studio/page.tsx` | Dashboard — scans bundled demo on server |
| `/studio/route/[[...segments]]` | `app/studio/route/[[...segments]]/page.tsx` | Route detail (supports `?github=` for imports) |
| `/scan` | `app/scan/page.tsx` | Analyzer debug table + raw JSON |
| `/api/scan` | `app/api/scan/route.ts` | JSON API for demo project |
| `/api/import/github` | `app/api/import/github/route.ts` | POST GitHub URL → scanned project |

---

## Key libraries

| Package | Use |
|---------|-----|
| `@xyflow/react` | Interactive route graph |
| `next` 16 | App Router, server components, API routes |
| `tailwindcss` 4 | Styling (`app/globals.css`) |

---

## Component map

```
components/
├── layout/studio-nav.tsx       Icon rail (home, studio, route detail, scan)
├── dashboard/
│   ├── dashboard-shell.tsx     3-column layout + GitHub import
│   ├── file-tree.tsx           Collapsible app/ tree
│   ├── route-graph.tsx         React Flow canvas
│   ├── route-node.tsx          Graph node card
│   ├── route-insights.tsx      Right panel insight cards
│   └── github-import-dialog.tsx
└── route-detail/
    ├── route-detail-shell.tsx  Breadcrumb + layout
    ├── route-metadata-panel.tsx
    ├── request-flow-diagram.tsx
    ├── suggested-fetch-panel.tsx
    └── route-faq-panel.tsx
```

---

## Lib map

```
lib/
├── analyzer/           Static scanner — see lib/analyzer/README.md
├── graph/build-graph.ts
├── github/             GitHub URL parse + download + monorepo discovery
├── route-detail/       Cache layers, FAQ, suggested fetch, URL helpers
├── demo-routes.ts      Canonical demo route IDs
├── example-project.ts  Resolves path to examples/my-app
├── project-source.ts   Client-side demo vs GitHub source state
└── build-parts.ts      Roadmap constants (landing page)
```

---

## Demo project path

`getExampleProjectPath()` tries, in order:

1. `web/examples/my-app` (bundled — works on Vercel)
2. `../examples/my-app` (local monorepo fallback)

---

## GitHub import flow

1. User pastes URL in `GitHubImportDialog`
2. `POST /api/import/github` → `importGitHubProject(url)`
3. Fetches GitHub tree API, downloads `app/` files to temp dir
4. Runs `scanProject(tempDir)`, returns `RouteProject`
5. Client stores source in `sessionStorage` via `project-source.ts`
6. Route detail links append `?github=<url>` to re-import server-side

Set `GITHUB_TOKEN` in `.env.local` for higher rate limits.

---

## Styling notes

- `.app-shell` — full viewport height (`100dvh`), no page scroll
- `.graph-canvas` — React Flow fills center panel
- Scrollbars hidden globally (`scrollbar-width: none`) but scroll still works
- Dark theme: zinc/violet palette matching Vercel-style mockups

---

## Adding a new insight signal

1. Add detection in `lib/analyzer/analyze-file.ts` → append to `cacheNotes[]`
2. Surface in `components/dashboard/route-insights.tsx` (quick cards)
3. Map to cache layer in `lib/route-detail/cache-layers.ts`
4. Add FAQ entry in `lib/route-detail/route-faq.ts` if useful

---

## Testing the analyzer

```bash
# Dev server running:
open http://localhost:3000/scan

# Or raw JSON:
curl -s localhost:3000/api/scan | jq '.routes[] | {url: .urlPath, rendering}'
```
