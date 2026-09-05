#!/usr/bin/env bash
# Push the spec tree to the braisost content mount on this Mac.
# The reader picks changes up on the next request — no braisost redeploy needed.
set -euo pipefail
SPEC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${BRAISOST_CONTENT:-/Users/matteo/Developer/braisost/content}/orient"
mkdir -p "${DEST}"
rsync -av --delete \
  --exclude '.git' --exclude '09-tasks/' --exclude 'scripts/' \
  --exclude '__pycache__' --exclude '.DS_Store' \
  "${SPEC}/" "${DEST}/"
echo "pushed to ${DEST}"
