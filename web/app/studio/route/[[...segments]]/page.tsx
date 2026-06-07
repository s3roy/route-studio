import { notFound, redirect } from "next/navigation";
import { scanProject } from "@/lib/analyzer";
import { getExampleProjectPath } from "@/lib/example-project";
import { importGitHubProject } from "@/lib/github/import-project";
import { getShareEntry } from "@/lib/share/share-store";
import { getCacheLayers } from "@/lib/route-detail/cache-layers";
import { getRouteFaq } from "@/lib/route-detail/route-faq";
import {
  defaultRouteForProject,
  findRouteById,
  getLayoutChain,
} from "@/lib/route-detail/resolve-route";
import { suggestFetch } from "@/lib/route-detail/suggested-fetch";
import { routeDetailHref, routeIdFromSegments } from "@/lib/route-detail/urls";
import { RouteDetailProblem } from "@/components/route-detail/route-detail-problem";
import { RouteDetailShell } from "@/components/route-detail/route-detail-shell";

type PageProps = {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<{ github?: string; share?: string }>;
};

export default async function RouteDetailPage({ params, searchParams }: PageProps) {
  const { segments } = await params;
  const { github, share } = await searchParams;
  const routeId = routeIdFromSegments(segments);
  const linkQuery = { github: github ?? null, share: share ?? null };

  let project;
  if (share) {
    const entry = getShareEntry(share);
    if (!entry) {
      return (
        <RouteDetailProblem
          title="Shared link expired"
          message="This share link is no longer available. Open the studio and create a new share link."
          share={share}
        />
      );
    }
    project = entry.project;
  } else if (github) {
    const imported = await importGitHubProject(github);
    if (!imported.ok) {
      return (
        <RouteDetailProblem
          title="Could not import repository"
          message={imported.error}
          github={github}
          suggestions={imported.suggestions}
        />
      );
    }
    project = imported.project;
  } else {
    const result = scanProject(getExampleProjectPath());
    if (!result.ok) notFound();
    project = result.project;
  }

  let route = findRouteById(project, routeId);
  if (!route) {
    const fallback = defaultRouteForProject(project);
    if (fallback && routeId !== fallback.id) {
      redirect(routeDetailHref(fallback.id, linkQuery));
    }

    return (
      <RouteDetailProblem
        title="Route not found"
        message={`No route matches "${routeId}" in ${project.name}. Pick a route below or return to the studio.`}
        github={github ?? null}
        share={share ?? null}
        project={project}
      />
    );
  }

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
      shareId={share ?? null}
    />
  );
}
