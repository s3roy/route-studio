#!/usr/bin/env bash
# Configure GitHub branch protection on main so only the code owner can merge.
#
# Usage:
#   ./scripts/setup-branch-protection.sh OWNER REPO GITHUB_USERNAME
#
# Example:
#   ./scripts/setup-branch-protection.sh souvik route-studio souvik
#
# Requires: gh CLI authenticated (gh auth login)

set -euo pipefail

OWNER="${1:?Usage: $0 OWNER REPO GITHUB_USERNAME}"
REPO="${2:?Usage: $0 OWNER REPO GITHUB_USERNAME}"
USERNAME="${3:?Usage: $0 OWNER REPO GITHUB_USERNAME}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi

echo "Protecting ${OWNER}/${REPO} branch main (code owner: @${USERNAME})..."

# Update CODEOWNERS in repo if still placeholder (local file only — commit separately)
if grep -q 'YOUR_GITHUB_USERNAME' .github/CODEOWNERS 2>/dev/null; then
  echo "Tip: commit .github/CODEOWNERS with @${USERNAME} before relying on code owner reviews."
fi

gh api \
  "repos/${OWNER}/${REPO}/branches/main/protection" \
  -X PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI / build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": {
    "users": ["${USERNAME}"],
    "teams": [],
    "apps": []
  },
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
EOF

echo ""
echo "Done. main is protected on ${OWNER}/${REPO}:"
echo "  - PRs required (with your approval as code owner)"
echo "  - CI 'CI / build' must pass"
echo "  - Only @${USERNAME} can push directly to main"
echo "  - Admins cannot bypass (enforce_admins: true)"
