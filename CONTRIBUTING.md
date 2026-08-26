# Contributing / Branching Workflow

This project uses a three-tier branching model, validated by CI before anything merges,
with every branch tied to a ticket (GitHub Issue) - similar to how Salesforce DX ties
a branch/PR to a ticket number and detects it automatically in the editor.

## Ticket-linked workflow (do this first, before branching)

1. **Create a GitHub Issue for the work** ("ticket") using the *Feature* or *Bug* template
   under the repo's **Issues** tab. This gets an auto-incrementing number, e.g. `#12`.

2. **Create the branch directly from the issue**: open the issue → right sidebar →
   **Development → Create a branch**. GitHub auto-names it using the issue number,
   e.g. `12-implement-jwt-auth`. This is what links the branch to the ticket.

3. **Install the official VS Code extension "GitHub Pull Requests and Issues"**
   (publisher: GitHub). Once installed and signed in:
   - The status bar shows the issue linked to your current branch.
   - The "GitHub" sidebar panel shows the ticket details without leaving VS Code.
   - This is the "detected ticket" behavior from the Salesforce example.

4. **Work and push to that branch as usual.** Every push updates the same PR -
   if CI validation fails and you push a fix, it's still the same ticket, same PR,
   nothing duplicates.

5. **In the PR description, keep the `Closes #12` line** (already in the PR template).
   This keeps the issue open and visibly linked through every review/CI cycle, and
   GitHub auto-closes the issue the moment the PR merges - matching the
   open-until-merged ticket lifecycle you're used to.

## Branching model

## Branches

| Branch | Purpose |
|---|---|
| `main` | Production. Always deployable. Protected - no direct pushes. |
| `develop` | Staging/release branch. Where features integrate before going live. Protected - no direct pushes. |
| `feature/<name>` | Your working branch for a single module/feature. Branched off `develop`. |

## Workflow

1. **Start from the branch GitHub created for your ticket** (see *Ticket-linked workflow*
   above), or create one manually off `develop` following the same `<issue-number>-description`
   naming pattern:
   ```bash
   git checkout develop
   git pull
   git checkout -b 12-implement-jwt-auth
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
