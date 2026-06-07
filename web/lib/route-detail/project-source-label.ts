import type { RouteProject } from "@/lib/analyzer";

/** Human-readable label for where a scan came from. */
export function describeProjectSource(project: RouteProject): string {
  if (project.github) {
    return project.rootPath || `${project.github.owner}/${project.github.repo}`;
  }
  if (project.rootPath.startsWith("http")) {
    return project.rootPath;
  }
  if (project.name && project.name !== "my-app") {
    return project.name;
  }
  return "examples/my-app (demo)";
}

export function isDemoProject(project: RouteProject): boolean {
  return !project.github && project.name === "my-app";
}
