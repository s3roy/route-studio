import { NextResponse } from "next/server";
import { importGitHubProject } from "@/lib/github/import-project";

export async function POST(request: Request) {
  let url: string | undefined;
  try {
    const body = (await request.json()) as { url?: string };
    url = body.url?.trim();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ ok: false, error: "Missing url in request body." }, { status: 400 });
  }

  const result = await importGitHubProject(url);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        suggestions: result.suggestions,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
