#!/usr/bin/env bash
# Shared helper functions - sourced by every script in this folder.
# Nothing in here runs on its own.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Loads GH_PAT (and anything else) from the repo root .env, then aliases
# GH_PAT -> GH_TOKEN, which is the env var the GitHub CLI ('gh') actually
# reads for non-interactive auth. If you've already run `gh auth login`
# once, you don't need GH_PAT at all - this is just for CI-less, fully
# scripted use (e.g. running these from a fresh machine without wanting
# to click through a browser login).
loadProjectConfig() {
  if [[ -f "$REPO_ROOT/.env" ]]; then
    set -a
    source "$REPO_ROOT/.env"
    set +a
  fi

  if [[ -n "$GH_PAT" && -z "$GH_TOKEN" ]]; then
    export GH_TOKEN="$GH_PAT"
  fi
}

checkGhInstalled() {
  if ! command -v gh &> /dev/null; then
    echo "GitHub CLI ('gh') is not installed."
    echo "Install: https://cli.github.com"
    exit 1
  fi
}

checkGhAuth() {
  if ! gh auth status &> /dev/null; then
    echo "GitHub CLI is not authenticated."
    echo "Either run 'gh auth login' once, or set GH_PAT in your .env file."
    exit 1
  fi
}

# Creates a label if it doesn't already exist, silently, so 'gh issue create
# --label X' never fails just because the label was never manually created
# in the repo (the GitHub website auto-creates labels from issue template
# front matter, but the gh CLI does not).
ensureLabelExists() {
  local labelName="$1"
  if ! gh label list --json name --jq '.[].name' 2>/dev/null | grep -qx "$labelName"; then
    gh label create "$labelName" --color "ededed" --description "Auto-created by deploy scripts" &> /dev/null
  fi
}

# Pulls the ticket number out of the current branch name.
# Expects branch format: <ticket-number>-description (e.g. 12-implement-auth),
# which is exactly the format GitHub generates when you click
# "Create a branch" from an Issue.
resolveTicketNumber() {
  local branch
  branch=$(git branch --show-current)
  TICKET_NUMBER=$(echo "$branch" | grep -oE '^[0-9]+')
  if [[ -z "$TICKET_NUMBER" ]]; then
    echo "Could not detect a ticket number from branch '$branch'."
    echo "Expected format: <ticket-number>-description (e.g. 12-implement-auth)"
    exit 1
  fi
}

# Warns you if 'develop' has moved ahead since you branched, and offers
# to merge it in before you push - avoids surprise conflicts in the PR.
checkFeatureUpToDate() {
  git fetch origin develop &> /dev/null
  local behind
  behind=$(git rev-list --count HEAD..origin/develop)
  if [[ "$behind" -gt 0 ]]; then
    echo "Your branch is $behind commit(s) behind 'develop'."
    echo "  1) Merge develop into this branch now"
    echo "  2) Continue anyway"
    read -p "Select option: " updateOption
    if [[ "$updateOption" -eq 1 ]]; then
      git merge origin/develop
    fi
  fi
}
