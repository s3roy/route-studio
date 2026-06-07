/** Bundled demo routes — ids match analyzer `RouteSegment.id`. */
export const DEMO_ROUTE_DETAIL = {
  id: "dashboard/settings",
  urlPath: "/dashboard/settings",
  label: "Settings",
  description: "Dynamic + no-store (mockup 02 example)",
} as const;

export const DEMO_ROUTES = [
  DEMO_ROUTE_DETAIL,
  { id: "dashboard", urlPath: "/dashboard", label: "Dashboard", description: "Nested layout + loading" },
  { id: "(auth)/login", urlPath: "/login", label: "Login", description: "Route group (auth)" },
  { id: "api/health", urlPath: "/api/health", label: "API health", description: "Route handler" },
] as const;
