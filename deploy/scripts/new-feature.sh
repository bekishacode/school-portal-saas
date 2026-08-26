#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"

echo "Feature Branch Creation Script"
echo ""

loadProjectConfig
checkGhInstalled
checkGhAuth

function operationOptions() {
  echo ""
  echo "Feature Branch Options:"
  echo "  1) Create feature branch (new ticket)"
  echo "  2) Create feature branch (existing ticket number)"
  echo "  3) Reset feature branch"
  read -p "Select option: " opt
  if [[ "$opt" -eq 1 ]]; then
    createFeatureNewTicket
  elif [[ "$opt" -eq 2 ]]; then
    createFeatureExistingTicket
  elif [[ "$opt" -eq 3 ]]; then
    resetFeature
  else
    exit 1
  fi
}

function branchFromDevelop() {
  git checkout develop
  git fetch origin
  git pull origin develop
}

function createFeatureNewTicket() {
  read -p "Ticket title: " title
  read -p "Ticket type (feature/bug) [feature]: " type
  type=${type:-feature}

  issueUrl=$(gh issue create --title "$title" --body "Created via new-feature.sh" --label "$type")
  ticketNumber=$(echo "$issueUrl" | grep -oE '[0-9]+$')
  slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr -s ' ' '-' | tr -cd 'a-z0-9-')
  branchName="${ticketNumber}-${slug}"

  branchFromDevelop
  git checkout -b "$branchName" origin/develop
  git push -u origin "$branchName"

  echo ""
  echo "Created ticket #$ticketNumber and branch '$branchName'."
  echo "Commit your work here, then run push-and-pr.sh when ready."
}

function createFeatureExistingTicket() {
  read -p "Existing ticket number: " ticketNumber
  read -p "Short branch description (e.g. implement-auth): " desc
  slug=$(echo "$desc" | tr '[:upper:]' '[:lower:]' | tr -s ' ' '-' | tr -cd 'a-z0-9-')
  branchName="${ticketNumber}-${slug}"

  branchFromDevelop
  git checkout -b "$branchName" origin/develop
  git push -u origin "$branchName"

  echo ""
  echo "Created branch '$branchName' linked to ticket #$ticketNumber."
}

function resetFeature() {
  read -p "Branch name to reset: " branchName
  echo "This resets '$branchName' to match 'develop' - all uncommitted/unpushed work on it is lost. Are you sure?"
  echo "  1) Yes"
  echo "  2) No"
  read -p "Select option: " resetOption
  if [[ "$resetOption" -eq 1 ]]; then
    git checkout "$branchName"
    git fetch origin develop
    git reset --hard origin/develop
    echo "Branch '$branchName' reset to match 'develop'."
  else
    operationOptions
  fi
}

operationOptions
