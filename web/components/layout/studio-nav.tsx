"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_ROUTE_DETAIL } from "@/lib/demo-routes";
import { routeDetailHref } from "@/lib/route-detail/urls";

const items = [
  { id: "home" as const, href: "/", label: "Home", icon: "⌂" },
  { id: "studio" as const, href: "/studio", label: "Dashboard & graph", icon: "▤" },
  {
    id: "route-detail" as const,
    href: routeDetailHref(DEMO_ROUTE_DETAIL.id),
    label: `${DEMO_ROUTE_DETAIL.label} route detail`,
    icon: "⚙",
  },
  { id: "scan" as const, href: "/scan", label: "Raw scan JSON", icon: "{ }" },
];

function activeNavId(pathname: string): (typeof items)[number]["id"] {
  if (pathname.startsWith("/scan")) return "scan";
  if (pathname.startsWith("/studio/route")) return "route-detail";
  if (pathname.startsWith("/studio")) return "studio";
  return "home";
}

export function StudioNav() {
  const pathname = usePathname();
  const active = activeNavId(pathname);

  return (
    <nav
      aria-label="Studio navigation"
      className="flex w-14 shrink-0 flex-col items-center border-r border-white/10 bg-zinc-950 py-3"
    >
      <Link
        href="/"
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-sm font-bold text-violet-300"
        title="Route Studio"
      >
        RS
      </Link>

      <ul className="flex flex-1 flex-col items-center gap-1">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-base transition ${
                  isActive
                    ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
