"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { routeDetailHrefForSession } from "@/lib/studio-session";
import {
  DatabaseIcon,
  FilesIcon,
  GitBranchIcon,
  SettingsIcon,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const baseItems = [
  { id: "files" as const, href: "/studio", label: "Files & graph", Icon: FilesIcon },
  { id: "graph" as const, href: "/studio", label: "Route graph", Icon: GitBranchIcon },
  { id: "scan" as const, href: "/scan", label: "Analyzer debug", Icon: DatabaseIcon },
  { id: "settings" as const, label: "Route detail", Icon: SettingsIcon },
];

function activeNavId(pathname: string): (typeof baseItems)[number]["id"] | null {
  if (pathname.startsWith("/scan")) return "scan";
  if (pathname.startsWith("/studio/route")) return "settings";
  if (pathname.startsWith("/studio")) return "files";
  return null;
}

type StudioNavProps = {
  nextVersion?: string | null;
};

export function StudioNav({ nextVersion }: StudioNavProps = {}) {
  const pathname = usePathname();
  const active = activeNavId(pathname);
  const [settingsHref, setSettingsHref] = useState("/studio/route/dashboard/settings");

  useEffect(() => {
    setSettingsHref(routeDetailHrefForSession());
  }, [pathname]);

  const items = baseItems.map((item) =>
    item.id === "settings" ? { ...item, href: settingsHref } : item,
  ) as Array<(typeof baseItems)[number] & { href: string }>;

  return (
    <nav
      aria-label="Studio navigation"
      className="theme-panel flex w-14 shrink-0 flex-col items-center border-r theme-border py-3"
    >
      <ul className="flex flex-col items-center gap-1">
        {items.map((item) => {
          const isActive = active === item.id;
          const Icon = item.Icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                  isActive ? "theme-nav-active" : "theme-muted theme-hover"
                }`}
              >
                <Icon size={18} />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex w-full flex-col items-center gap-2 border-t theme-border px-2 pt-3">
        {nextVersion ? (
          <p className="theme-muted text-center text-[10px] leading-tight">Next.js {nextVersion}</p>
        ) : null}
        <ThemeToggle compact className="border-0 bg-transparent" />
      </div>
    </nav>
  );
}
