import { NextResponse } from "next/server";
import { scanProject } from "@/lib/analyzer";
import { getExampleProjectPath } from "@/lib/example-project";

export async function GET() {
  const result = scanProject(getExampleProjectPath());
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result.project);
}
