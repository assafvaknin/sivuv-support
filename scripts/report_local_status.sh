#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
state="${1:-success}"
case "$state" in
  pending|success|failure|error) ;;
  *) echo "Usage: $0 pending|success|failure|error [commit]" >&2; exit 2 ;;
esac

commit="${2:-$(git rev-parse HEAD)}"
repository="${GH_REPOSITORY:-assafvaknin/sivuv-support}"
gh api --method POST "repos/${repository}/statuses/${commit}" \
  -f state="$state" \
  -f context="Local Mac verification" \
  -f description="Local Mac verification ${state}" >/dev/null
echo "Published 'Local Mac verification'=${state} for ${commit}."
