#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

echo "Production Release Script (develop -> master)"
echo ""

loadProjectConfig
checkGhInstalled
checkGhAuth

git checkout develop
git fetch origin
git pull origin develop

existingPr=$(gh pr list --head develop --base master --json number --jq '.[0].number')

if [[ -z "$existingPr" ]]; then
  echo "List the ticket numbers included in this release, separated by spaces (e.g. 4 7 9):"
  read -p "> " ticketNumbers

  closesLines=""
  for t in $ticketNumbers; do
    closesLines="${closesLines}Closes #${t}"$'\n'
  done

  releaseTitle="Release $(date +%Y-%m-%d)"
  if gh pr create \
    --base master \
    --head develop \
    --title "$releaseTitle" \
    --body "$closesLines"; then
    echo "Created release PR: $releaseTitle"
  else
    echo ""
    echo "Failed to create the release PR - see the error above."
    echo "Common cause: 'develop' and 'master' have no differences (nothing to release)."
    exit 1
  fi
else
  echo "Release PR #$existingPr already exists (develop -> master) - it will pick up any new commits automatically."
fi

echo ""
echo "Watching CI checks..."
gh pr checks develop --watch

echo ""
echo "If checks passed: merge the release PR on GitHub, or run:"
echo "  gh pr merge develop --merge"
echo "(use --merge, not --squash, for the release PR so master keeps the individual commit history)"
