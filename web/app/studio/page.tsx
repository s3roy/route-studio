import { scanProject } from "@/lib/analyzer";
import { getExampleProjectPath } from "@/lib/example-project";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import Link from "next/link";

export default function StudioPage() {
  const result = scanProject(getExampleProjectPath());

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 text-red-400">
        <div>
          <p>Scan failed: {result.error}</p>
          <Link href="/" className="mt-4 inline-block text-zinc-400 underline">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return <DashboardShell initialProject={result.project} />;
}
