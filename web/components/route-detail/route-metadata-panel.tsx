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
      <div className="border-b border-white/10 px-4 py-4">
        <p className="font-mono text-base font-semibold text-zinc-100">{route.urlPath}</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">{describeRoute(route)}</p>
      </div>

      <div className="space-y-2.5 border-b border-white/10 px-4 py-4">
        <MetaRow label="Runtime" value={runtimeLabel(route)} />
        <MetaRow
          label="Rendering"
          value={route.rendering === "dynamic" ? "Dynamic" : route.rendering === "static" ? "Static" : "Unknown"}
        />
        <MetaRow label="Segment config" value={segmentConfigLabel(route)} />
        <MetaRow label="Revalidate" value={route.revalidate != null ? String(route.revalidate) : "0"} />
      </div>

      <div className="flex-1 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Caching layers
        </p>
        <ul className="mt-3 space-y-2.5">
          {layers.map((layer) => (
            <li key={layer.id} className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <LayerIcon status={layer.status} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200">{layer.name}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{layer.description}</p>
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

      <div className="mt-auto border-t border-white/10 px-4 py-3 text-[11px] text-zinc-600">
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
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
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
