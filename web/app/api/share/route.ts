import { NextResponse } from "next/server";
import type { RouteProject } from "@/lib/analyzer";
import { createShareLink, getShareEntry } from "@/lib/share/share-store";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }

  const entry = getShareEntry(id);
  if (!entry) {
    return NextResponse.json(
      { ok: false, error: "Share link expired or not found. Links last about 1 hour." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    project: entry.project,
    routeId: entry.routeId,
    selectedPath: entry.selectedPath,
  });
}

export async function POST(request: Request) {
  let body: {
    project?: RouteProject;
    routeId?: string;
    selectedPath?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.project?.routes?.length) {
    return NextResponse.json({ ok: false, error: "Missing project in request body." }, { status: 400 });
  }

  const shareId = createShareLink({
    project: body.project,
    routeId: body.routeId,
    selectedPath: body.selectedPath,
  });

  return NextResponse.json({ ok: true, shareId });
}
