# Contributing / Branching Workflow

This project uses a three-tier branching model, validated by CI before anything merges.

## Branches

| Branch | Purpose |
|---|---|
| `main` | Production. Always deployable. Protected - no direct pushes. |
| `develop` | Staging/release branch. Where features integrate before going live. Protected - no direct pushes. |
| `feature/<name>` | Your working branch for a single module/feature. Branched off `develop`. |

## Workflow

1. **Start a feature branch from `develop`:**
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/auth-module
   ```

2. **Work, commit, push:**
   ```bash
   git push -u origin feature/auth-module
   ```

3. **Open a PR into `develop`.**
   - This triggers the CI validation workflow (lint, build, test) automatically.
   - The PR cannot be merged until CI passes (enforced by branch protection rules - see setup below).
   - At least one review is required if working with your friend (recommended for cross-app changes touching `packages/shared-types`).

4. **Once enough features are merged into `develop` and it's stable, cut a release PR:**
   ```bash
   # open a PR: develop -> main
   ```
   - CI runs again on this PR as the final "dry run" before production.
   - Merge only when this passes.

5. **After merging to `main`, tag a release (optional but recommended):**
   ```bash
   git checkout main
   git pull
   git tag -a v0.1.0 -m "Phase 1 MVP"
   git push origin v0.1.0
   ```

## Branch protection setup (do this once in GitHub repo settings)

GitHub → your repo → **Settings → Branches → Add branch protection rule**

For both `main` and `develop`:
- Require a pull request before merging
- Require status checks to pass before merging → select `Validate API (NestJS)` and `Validate Web (Next.js)` (these appear after the first PR triggers the workflow once)
- Require branches to be up to date before merging
- (Recommended once it's you + your friend) Require at least 1 approval before merging
- Do not allow bypassing the above settings, even for admins - keeps the rule real

This mirrors the Salesforce-style pipeline: feature branch -> PR -> validation/dry run -> merge -> release branch -> validation -> merge to production.
