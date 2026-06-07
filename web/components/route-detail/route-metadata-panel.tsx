import type { CacheLayer } from "@/lib/route-detail/cache-layers";
import type { RouteSegment } from "@/lib/analyzer";
import {
  describeRoute,
  runtimeLabel,
  segmentConfigLabel,
} from "@/lib/route-detail/resolve-route";

type RouteMetadataPanelProps = {
  route: RouteSegment;
  layers: CacheLayer[];
};

/** Mockup 02 — left sidebar metadata + cache layers. */
export function RouteMetadataPanel({ route, layers }: RouteMetadataPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto text-[13px] leading-snug">
      <div className="theme-border border-b px-4 py-4">
        <p className="theme-text font-mono text-base font-semibold">{route.urlPath}</p>
        <p className="theme-muted mt-2 text-xs leading-relaxed">{describeRoute(route)}</p>
      </div>

      <div className="theme-border space-y-2.5 border-b px-4 py-4">
        <MetaRow label="Runtime" value={runtimeLabel(route)} />
        <MetaRow
          label="Rendering"
          value={route.rendering === "dynamic" ? "Dynamic" : route.rendering === "static" ? "Static" : "Unknown"}
        />
        <MetaRow label="Segment config" value={segmentConfigLabel(route)} />
        <MetaRow label="Revalidate" value={route.revalidate != null ? String(route.revalidate) : "0"} />
      </div>

      <div className="flex-1 px-4 py-4">
        <p className="theme-muted text-[11px] font-semibold uppercase tracking-wider">
          Caching layers
        </p>
        <ul className="mt-3 space-y-2.5">
          {layers.map((layer) => (
            <li key={layer.id} className="theme-border theme-subtle rounded-lg border px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <LayerIcon status={layer.status} />
                <div className="min-w-0">
                  <p className="theme-text-secondary text-xs font-medium">{layer.name}</p>
                  <p className="theme-muted mt-1 text-[11px] leading-relaxed">{layer.description}</p>
                  {layer.note ? (
                    <p className="mt-2 rounded bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">
                      {layer.note}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="theme-border theme-muted-subtle mt-auto border-t px-4 py-3 text-[11px]">
        <p>Scanned from examples/my-app</p>
        <p className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Development
        </p>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="theme-muted">{label}</span>
      <span className="theme-text-secondary font-medium">{value}</span>
    </div>
  );
}

function LayerIcon({ status }: { status: CacheLayer["status"] }) {
  if (status === "active") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400">
        ✓
      </span>
    );
  }
  if (status === "inactive") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xs text-red-400">
        ✕
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-xs text-zinc-500">
      ○
    </span>
  );
}
