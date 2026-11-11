#!/usr/bin/env bash
# Build the submission zip: the repository including .git, without node_modules and dist.
#   scripts/pa2-zip.sh 23120001-23120002-23120322 88
# -> ../23120001-23120002-23120322_88.zip  (IDs ascending, joined by -, then _total)
set -euo pipefail
IDS=${1:?student IDs ascending, joined by -}
TOTAL=${2:?self-assessed total}
ROOT=$(git rev-parse --show-toplevel)
NAME="${IDS}_${TOTAL}.zip"
for f in PA2.md AI-LOG.md SELF_ASSESSMENT_REPORT.md; do
  [[ -f "$ROOT/$f" ]] || { echo "missing $f" >&2; exit 1; }
done
grep -q "<REPO_URL>\|<PR_RED_URL>\|<PR_BREAK_URL>" "$ROOT/PA2.md" && { echo "PA2.md still has placeholders; run scripts/pa2-github.sh first" >&2; exit 1; }
git -C "$ROOT" rev-parse pa2 >/dev/null 2>&1 || { echo "tag pa2 missing" >&2; exit 1; }
cd "$(dirname "$ROOT")"
rm -f "$NAME"
zip -qr "$NAME" "$(basename "$ROOT")" -x "*/node_modules/*" "*/dist/*" "*/.env" "*/.env.*" "*/coverage/*"
unzip -l "$NAME" | tail -1
echo "wrote $(pwd)/$NAME"
