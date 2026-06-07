import Link from "next/link";
import { Suspense } from "react";
import { scanProject } from "@/lib/analyzer";
import { getExampleProjectPath } from "@/lib/example-project";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function StudioPage() {
  const result = scanProject(getExampleProjectPath());

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-red-400 theme-shell">
        <div>
          <p>Scan failed: {result.error}</p>
          <Link href="/" className="mt-4 inline-block text-zinc-400 underline">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="app-shell theme-shell flex items-center justify-center">
          Loading studio…
        </div>
      }
    >
      <DashboardShell initialProject={result.project} />
    </Suspense>
  );
}
