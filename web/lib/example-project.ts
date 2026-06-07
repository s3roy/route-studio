import fs from "node:fs";
import path from "node:path";

const CANDIDATE_PATHS = [
  path.join(process.cwd(), "examples", "my-app"),
  path.join(process.cwd(), "..", "examples", "my-app"),
];

/** Bundled demo project — works locally and on Vercel (web/examples/my-app). */
export function getExampleProjectPath(): string {
  for (const candidate of CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return CANDIDATE_PATHS[0];
}
