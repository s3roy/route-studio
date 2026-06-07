# Analyzer

Static scanner for Next.js App Router projects. Reads the filesystem — **does not execute** the target app.

## Public API

```ts
import { scanProject } from "@/lib/analyzer";

const result = scanProject("/path/to/next-app");

if (result.ok) {
  console.log(result.project.routes);
  console.log(result.project.tree);
} else {
  console.error(result.error);
}
```

## Modules

| File | Responsibility |
|------|----------------|
| `index.ts` | Re-exports `scanProject` and types |
| `scan-project.ts` | Entry point — walks `app/`, builds tree + routes |
| `segments.ts` | Parses folder names: `(auth)`, `[id]`, `[...slug]`, `@slot` |
| `analyze-file.ts` | Source heuristics: RSC/client, dynamic, cache signals |
| `types.ts` | `RouteProject`, `RouteSegment`, `FileTreeNode`, etc. |

## Scan pipeline

```
findAppDir(root)
  → walkTree(app/)           FileTreeNode[]
  → collectRouteSegments()   RouteSegment[] (one per page/route handler)
  → readNextVersion()        from package.json
  → findProxy()              proxy.ts or middleware.ts
```

Each route segment aggregates all special files in its folder (`page.tsx`, `layout.tsx` in ancestors, etc.) and merges `cacheNotes` from combined source.

## Source heuristics (`analyze-file.ts`)

| Pattern | Effect |
|---------|--------|
| `"use client"` | `isClientComponent: true` |
| `export const dynamic = 'force-dynamic'` | `rendering: 'dynamic'` |
| `export const dynamic = 'force-static'` | `rendering: 'static'` |
| `export const revalidate = N` | Sets revalidate; `false` → dynamic |
| `cache: 'no-store'` / `fetch(..., { cache: 'no-store' })` | Dynamic + cache note |
| `next: { revalidate: N }` | Cache note |
| `cookies()` / `headers()` | Dynamic signal |
| `export const runtime = 'edge'` | `runtime: 'edge'` |

Heuristics are regex-based (v1). False positives/negatives are possible on complex code.

## Route IDs vs URL paths

| `RouteSegment.id` | `RouteSegment.urlPath` |
|-------------------|------------------------|
| `dashboard/settings` | `/dashboard/settings` |
| `(auth)/login` | `/login` |
| `/` | `/` |
| `api/health` | `/api/health` |

Route detail URLs use **ids**: `/studio/route/dashboard/settings`.

## Debug

- UI: http://localhost:3000/scan
- API: http://localhost:3000/api/scan
- Demo path: `web/examples/my-app`
