#!/usr/bin/env bash
# Verifies every public app URL returns HTTP 200. Exits non-zero if any fail,
# so the deploy job goes red when one of OUR apps is down.
# delivery is checked once its DNS record exists (a missing A-record is reported
# loudly but does not fail older, unrelated deploys).
# signoz is shared third-party observability infra this repo does not deploy, so
# it is advisory only: its status is reported but never fails the deploy.
set -uo pipefail

URLS=(
  "https://didibhaiyakibiryani.com"
  "https://server.didibhaiyakibiryani.com"
  "https://admin.didibhaiyakibiryani.com"
  "https://native.didibhaiyakibiryani.com"
)

# DNS-gated required URLs (our apps): enforced as soon as the record resolves.
CANDIDATE_URLS=(
  "https://delivery.didibhaiyakibiryani.com"
  "https://survey.didibhaiyakibiryani.com"
  "https://track.didibhaiyakibiryani.com"
)
for url in "${CANDIDATE_URLS[@]}"; do
  host="${url#https://}"
  if getent hosts "${host}" >/dev/null 2>&1; then
    URLS+=("${url}")
  else
    echo "⚠ SKIPPED (no DNS record yet): ${url} — add an A-record → this host to enable it"
  fi
done

# Advisory endpoints: shared / third-party infra not deployed by this repo
# (e.g. SigNoz observability). Reported but never fatal.
ADVISORY_URLS=(
  "https://signoz.didibhaiyakibiryani.com"
)

RETRIES="${RETRIES:-10}"
SLEEP="${SLEEP:-6}"
fail=0

probe() {
  local url="$1" retries="$2" code=000 i
  for ((i = 1; i <= retries; i++)); do
    code="$(curl -s -o /dev/null -L -m 15 -w '%{http_code}' "${url}" || echo 000)"
    if [ "${code}" = "200" ]; then break; fi
    sleep "${SLEEP}"
  done
  echo "${code}"
}

for url in "${URLS[@]}"; do
  code="$(probe "${url}" "${RETRIES}")"
  if [ "${code}" = "200" ]; then
    echo "✅ 200 OK   ${url}"
  else
    echo "❌ ${code}      ${url}"
    fail=1
  fi
done

# Advisory checks — single attempt, never fail the deploy.
for url in "${ADVISORY_URLS[@]}"; do
  host="${url#https://}"
  if ! getent hosts "${host}" >/dev/null 2>&1; then
    continue
  fi
  code="$(probe "${url}" 1)"
  if [ "${code}" = "200" ]; then
    echo "✅ 200 OK   ${url} (advisory)"
  else
    echo "⚠ ${code}      ${url} (advisory — shared infra, not failing deploy)"
  fi
done

if [ "${fail}" -ne 0 ]; then
  echo "One or more app endpoints did not return 200." >&2
  exit 1
fi
echo "All app endpoints returned 200 OK."
