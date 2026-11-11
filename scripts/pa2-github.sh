#!/usr/bin/env bash
# PA#2 GitHub steps, in order, with gh. Run from the repository root on main with a clean tree:
#   REPO=<owner>/leetkob scripts/pa2-github.sh
# Needs: gh (https://cli.github.com) logged in with repo + workflow scope, and the three
# local branches this script expects (main, feat/publication-counts-reviewed, break/foreign-lab-403).
# Every step is idempotent enough to re-run after a failure.
set -euo pipefail

: "${REPO:?set REPO=<owner>/<name>, e.g. REPO=pogdepZ/leetkob}"
FEAT=feat/publication-counts-reviewed
BREAK=break/foreign-lab-403
DOCS=docs/pa2-links

say() { printf '\n==> %s\n' "$*"; }
run_url_for() { # branch -> URL of the latest workflow run on it (waits until one exists)
  local branch=$1 url=""
  for _ in $(seq 1 30); do
    url=$(gh run list --repo "$REPO" --branch "$branch" --workflow ci --limit 1 --json url --jq '.[0].url // empty')
    [[ -n "$url" ]] && { echo "$url"; return; }
    sleep 5
  done
  echo "no run found for $branch" >&2; exit 1
}
wait_checks() { # pr-number -> waits until no check is pending, prints each state; never fails on red
  local pr=$1 pending
  for _ in $(seq 1 240); do # up to 20 minutes
    pending=$(gh pr checks "$pr" --repo "$REPO" --json state --jq '[.[] | select(.state=="PENDING" or .state=="IN_PROGRESS" or .state=="QUEUED")] | length' 2>/dev/null || echo 1)
    [[ "$pending" == "0" ]] && break
    sleep 5
  done
  gh pr checks "$pr" --repo "$REPO" --json name,state --jq '.[] | "\(.name): \(.state)"'
}

gh auth status >/dev/null
git switch -q main
[[ -z "$(git status --porcelain)" ]] || { echo "working tree not clean" >&2; exit 1; }

say "1/7 create the public repository and push main"
if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source=. --remote=origin --push \
    --description "LeeTKOB — constraint review for C++ lab submissions (CSC13114)"
else
  git push -u origin main
fi
REPO_URL=https://github.com/$REPO

say "2/7 protect main: the four checks are required, admins included"
gh api -X PUT "repos/$REPO/branches/main/protection" --input scripts/branch-protection.json >/dev/null
gh api "repos/$REPO/branches/main/protection" > docs/evidence/branch-protection.json
echo "saved docs/evidence/branch-protection.json (commit it in step 6)"

say "3/7 PR 1: push only the red commit, open the PR, let CI go red"
RED_SHA=$(git rev-parse "$FEAT~1")
GREEN_SHA=$(git rev-parse "$FEAT")
git push -f origin "$RED_SHA:refs/heads/$FEAT"
PR1=$(gh pr list --repo "$REPO" --head "$FEAT" --json number --jq '.[0].number // empty')
if [[ -z "$PR1" ]]; then
  PR1=$(gh pr create --repo "$REPO" --base main --head "$FEAT" \
    --title "feat: publication reports counts.reviewed" \
    --body "Adds \`counts.reviewed\` to the publish response. First commit touches the route only; CI is expected to go red on typecheck and test. The fix commit follows with the contract row, the type and the test." \
    | grep -oE '[0-9]+$')
fi
echo "PR 1: $REPO_URL/pull/$PR1"
wait_checks "$PR1"
RED_RUN=$(run_url_for "$FEAT")
echo "red run: $RED_RUN"
read -r -p "Open the PR and confirm the Merge button is blocked, then press Enter to push the fix... " _

say "4/7 PR 1: push the green commit, wait for green, merge"
git push origin "$GREEN_SHA:refs/heads/$FEAT"
wait_checks "$PR1"
GREEN_RUN=$(run_url_for "$FEAT")
gh pr merge "$PR1" --repo "$REPO" --merge --delete-branch=false
git pull -q --ff-only origin main
echo "green run: $GREEN_RUN"

say "5/7 PR 2: the deliberate contract break; CI must go red; the PR stays open and unmerged"
git push -f origin "$BREAK"
PR2=$(gh pr list --repo "$REPO" --head "$BREAK" --json number --jq '.[0].number // empty')
if [[ -z "$PR2" ]]; then
  PR2=$(gh pr create --repo "$REPO" --base main --head "$BREAK" \
    --title "DO NOT MERGE — deliberate contract break: 403 for another TA's lab" \
    --body "PA#2 evidence for criterion 6. The contract (docs/contract/publish-lab.md, Who may call it) says a foreign lab answers 404 lab-not-found. This commit answers 403, so the contract tests must fail and the merge must be blocked." \
    | grep -oE '[0-9]+$')
fi
echo "PR 2: $REPO_URL/pull/$PR2"
wait_checks "$PR2"
BREAK_RUN=$(run_url_for "$BREAK")
BREAK_SHA=$(git rev-parse "$BREAK")
echo "break run: $BREAK_RUN"

say "6/7 PR 3: fill the links into PA2.md and SELF_ASSESSMENT_REPORT.md, commit the protection evidence"
git switch -q -c "$DOCS" main 2>/dev/null || git switch -q "$DOCS"
fill() { sed -i "s|$1|$2|g" PA2.md SELF_ASSESSMENT_REPORT.md AI-LOG.md README.md; }
fill '<REPO_URL>' "$REPO_URL"
fill 'https://github.com/<org>/leetkob' "$REPO_URL"
fill '<PR_RED_URL>' "$REPO_URL/pull/$PR1"
fill '<RED_RUN_URL>' "$RED_RUN"
fill '<RED_COMMIT_URL>' "$REPO_URL/commit/$RED_SHA"
fill '<GREEN_COMMIT_URL>' "$REPO_URL/commit/$GREEN_SHA"
fill '<GREEN_RUN_URL>' "$GREEN_RUN"
fill '<PR_BREAK_URL>' "$REPO_URL/pull/$PR2"
fill '<BREAK_RUN_URL>' "$BREAK_RUN"
fill '<BREAK_COMMIT_URL>' "$REPO_URL/commit/$BREAK_SHA"
git add PA2.md SELF_ASSESSMENT_REPORT.md AI-LOG.md README.md docs/evidence/
git commit -qm "docs(pa2): links to the blocked PR, the green commit, the contract break and the protection evidence"
git push -u origin "$DOCS"
PR3=$(gh pr create --repo "$REPO" --base main --head "$DOCS" \
  --title "docs: PA2.md links and self-assessment" \
  --body "Fills the evidence links. No code change." | grep -oE '[0-9]+$')
wait_checks "$PR3"
gh pr merge "$PR3" --repo "$REPO" --merge --delete-branch=false
git switch -q main && git pull -q --ff-only origin main

say "7/7 tag pa2 on main and push the tag"
git tag -f pa2
git push -f origin pa2
echo "CI for the tag: $REPO_URL/actions?query=branch%3Apa2"
echo
echo "Done. Take a screenshot of $REPO_URL/settings/branches into docs/evidence/branch-protection.png"
echo "(optional; docs/evidence/branch-protection.json is already committed), then run scripts/pa2-zip.sh."
