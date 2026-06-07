# Contributing to Route Studio

Thanks for your interest in Route Studio! This project is open source (MIT), but **`main` is protected** — only the maintainer can approve and merge pull requests.

## How to contribute

1. **Fork** the repository on GitHub.
2. **Clone** your fork and create a branch from `main`:
   ```bash
   git checkout -b feat/my-change
   ```
3. **Make changes** in the `web/` folder (see [web/README.md](./web/README.md)).
4. **Verify** locally:
   ```bash
   cd web
   npm install
   npm run lint
   npm run build
   ```
5. **Commit** with a clear message and **push** to your fork.
6. **Open a pull request** against `main` on the upstream repo.

Do **not** push directly to `main` — it is blocked for everyone except via reviewed PRs.

## Branch protection (maintainer)

After creating the GitHub repo, run once (replace `OWNER/REPO` and your username):

```bash
# 1. Edit .github/CODEOWNERS — replace YOUR_GITHUB_USERNAME with your handle
# 2. Push repo, then:
./scripts/setup-branch-protection.sh OWNER REPO YOUR_GITHUB_USERNAME
```

Or configure manually in GitHub → **Settings → Branches → Branch protection rules** for `main`:

| Setting | Value |
|---------|--------|
| Require a pull request before merging | ✅ |
| Require approvals | ✅ (1) |
| Require review from Code Owners | ✅ |
| Do not allow bypassing the above settings | ✅ |
| Require status checks to pass | ✅ (`CI / build`) |
| Restrict who can push to matching branches | ✅ (maintainers only) |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

Result: contributors can fork and open PRs, but **only you** (code owner) can approve and merge to `main`.

## Code guidelines

- Match existing TypeScript + Tailwind patterns.
- Keep PRs focused — one feature or fix per PR.
- Update README if you change user-facing behavior or APIs.

## Questions

Open a GitHub issue for bugs, ideas, or questions.
