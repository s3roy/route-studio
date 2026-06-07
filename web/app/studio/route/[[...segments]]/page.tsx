import { notFound } from "next/navigation";
import { scanProject } from "@/lib/analyzer";
import { getExampleProjectPath } from "@/lib/example-project";
import { importGitHubProject } from "@/lib/github/import-project";
import { getCacheLayers } from "@/lib/route-detail/cache-layers";
import { getRouteFaq } from "@/lib/route-detail/route-faq";
import {
  findRouteById,
  getLayoutChain,
} from "@/lib/route-detail/resolve-route";
import { suggestFetch } from "@/lib/route-detail/suggested-fetch";
import { routeIdFromSegments } from "@/lib/route-detail/urls";
import { RouteDetailShell } from "@/components/route-detail/route-detail-shell";

type PageProps = {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<{ github?: string }>;
};

export default async function RouteDetailPage({ params, searchParams }: PageProps) {
  const { segments } = await params;
  const { github } = await searchParams;
  const routeId = routeIdFromSegments(segments);

  let project;
  if (github) {
    const imported = await importGitHubProject(github);
    if (!imported.ok) notFound();
    project = imported.project;
  } else {
    const result = scanProject(getExampleProjectPath());
    if (!result.ok) notFound();
    project = result.project;
  }

  const route = findRouteById(project, routeId);
  if (!route) notFound();

  const layers = getCacheLayers(route);
  const layoutChain = getLayoutChain(project, route);
  const suggestion = await suggestFetch(project, route);
  const faq = getRouteFaq(route);

  return (
    <RouteDetailShell
      project={project}
      route={route}
      layers={layers}
      layoutChain={layoutChain}
      suggestion={suggestion}
      faq={faq}
      githubUrl={github ?? null}
    />
  );
}
