#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== Runtime =="
node --version
npm --version

echo "== Support-site validation and tests =="
npm run ci

if [[ "${PUBLISH_LOCAL_STATUS:-0}" == "1" ]]; then
  scripts/report_local_status.sh success
fi

echo "PASS — support-site validation and tests passed locally."
