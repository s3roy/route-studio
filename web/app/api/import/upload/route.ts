import { NextResponse } from "next/server";
import { importFromUpload } from "@/lib/upload/import-upload";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });
  }

  const paths = formData.getAll("paths").map(String);
  const fileEntries = formData.getAll("files");
  const files: { relativePath: string; content: Buffer }[] = [];

  for (let i = 0; i < fileEntries.length; i++) {
    const entry = fileEntries[i];
    if (!(entry instanceof File)) continue;
    const relativePath = paths[i] ?? entry.name;
    const content = Buffer.from(await entry.arrayBuffer());
    files.push({ relativePath, content });
  }

  const result = importFromUpload(files);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    project: result.project,
    projectName: result.projectName,
  });
}
