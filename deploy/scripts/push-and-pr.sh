#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

echo "Feature Branch Push + PR Script"
echo ""

loadProjectConfig
checkGhInstalled
checkGhAuth
resolveTicketNumber
checkFeatureUpToDate

branchName=$(git branch --show-current)

echo "Pushing '$branchName' to origin..."
git push -u origin "$branchName"

# If a PR already exists for this branch, this updates it instead of
# creating a duplicate - so you can run this script again after fixing
# a failed check, and it just re-validates the same PR.
existingPr=$(gh pr list --head "$branchName" --base develop --json number --jq '.[0].number')

if [[ -z "$existingPr" ]]; then
  echo "Creating PR into develop..."
  gh pr create \
    --base develop \
    --head "$branchName" \
    --title "$branchName" \
    --body "Closes #${TICKET_NUMBER}"
else
  echo "PR #$existingPr already exists for this branch - new commits will be validated automatically."
fi

echo ""
echo "Waiting for checks to register..."
sleep 8

echo "Watching CI checks (Ctrl+C to stop watching without cancelling checks)..."
gh pr checks "$branchName" --watch --interval 5

echo ""
echo "If checks failed: fix the code, commit, and run this script again."
echo "If checks passed: merge the PR on GitHub, or run:"
echo "  gh pr merge $branchName --squash"
