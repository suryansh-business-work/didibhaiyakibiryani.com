#!/usr/bin/env bash
# Verifies every public URL returns HTTP 200. Exits non-zero if any fail,
# so the deploy job goes red when something is down.
set -uo pipefail

URLS=(
  "https://didibhaiyakibiryani.com"
  "https://server.didibhaiyakibiryani.com"
  "https://admin.didibhaiyakibiryani.com"
  "https://native.didibhaiyakibiryani.com"
)

RETRIES="${RETRIES:-10}"
SLEEP="${SLEEP:-6}"
fail=0

for url in "${URLS[@]}"; do
  code=000
  for ((i = 1; i <= RETRIES; i++)); do
    code="$(curl -s -o /dev/null -L -m 15 -w '%{http_code}' "${url}" || echo 000)"
    if [ "${code}" = "200" ]; then break; fi
    sleep "${SLEEP}"
  done
  if [ "${code}" = "200" ]; then
    echo "✅ 200 OK   ${url}"
  else
    echo "❌ ${code}      ${url}"
    fail=1
  fi
done

if [ "${fail}" -ne 0 ]; then
  echo "One or more endpoints did not return 200." >&2
  exit 1
fi
echo "All endpoints returned 200 OK."
