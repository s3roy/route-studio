export type ParsedGitHubUrl = {
  owner: string;
  repo: string;
  ref?: string;
  /** Repo-relative folder, e.g. apps/web */
  subpath?: string;
};

export function parseGitHubUrl(input: string): ParsedGitHubUrl | null {
  const trimmed = input.trim().replace(/\/$/, "");

  const full = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.*))?)?$/,
  );
  if (full) {
    return {
      owner: full[1],
      repo: full[2].replace(/\.git$/, ""),
      ref: full[3],
      subpath: full[4] || undefined,
    };
  }

  const shorthand = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (shorthand) {
    return { owner: shorthand[1], repo: shorthand[2] };
  }

  return null;
}

export function formatGitHubUrl(parsed: ParsedGitHubUrl, ref: string): string {
  const base = `https://github.com/${parsed.owner}/${parsed.repo}`;
  if (parsed.subpath) return `${base}/tree/${ref}/${parsed.subpath}`;
  return `${base}/tree/${ref}`;
}
