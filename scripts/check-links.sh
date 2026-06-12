#!/usr/bin/env bash
# check-links.sh — deterministic link audit for an HTML page's external URLs.
#
# Usage:
#   check-links.sh <html-file> [output-json]
#
# Extracts unique http(s) hrefs, requests each (HEAD first, GET retry when the
# server rejects HEAD), and writes a JSON array to the output file (default
# /tmp/improve-quality-links.json) plus a one-line summary to stdout:
#
#   [{"url": "...", "status": 200, "ok": true, "final_url": "..."}]
#
# ok = final status 2xx. Redirects are followed; final_url shows where the URL
# actually lands so the factual subagent can spot citation drift (a spec URL
# that now redirects to a marketing page). Status 0 means DNS/connect failure.
#
# This replaces "ask the LLM whether the links resolve" with a check that
# cannot hallucinate. Policy decisions (no Wikipedia, primary sources only)
# stay with the agent — this script only reports reachability.

set -euo pipefail

HTML="${1:?Usage: check-links.sh <html-file> [output-json]}"
OUT="${2:-/tmp/improve-quality-links.json}"
[ -f "$HTML" ] || { echo "ERROR: file not found: $HTML" >&2; exit 2; }

UA="Mozilla/5.0 (compatible; improve-quality-link-check)"
TIMEOUT="${LINK_CHECK_TIMEOUT:-15}"

# grep -oE + sed instead of GNU-only grep -P, so the script also runs on BSD/macOS grep.
mapfile -t urls < <(grep -oE 'href="https?://[^"]+"' "$HTML" | sed -E 's/^href="|"$//g' | sort -u)

results="[]"
for url in "${urls[@]}"; do
  out=$(curl -sIL -o /dev/null -A "$UA" --max-time "$TIMEOUT" \
      -w '%{http_code} %{url_effective}' "$url" 2>/dev/null) || out="0 $url"
  status="${out%% *}"; final="${out#* }"
  # Some servers reject HEAD (405/403/501) — retry those with GET before judging.
  if [ "$status" -ge 400 ] || [ "$status" -eq 0 ]; then
    out=$(curl -sL -o /dev/null -A "$UA" --max-time "$TIMEOUT" \
        -w '%{http_code} %{url_effective}' "$url" 2>/dev/null) || out="0 $url"
    status="${out%% *}"; final="${out#* }"
  fi
  ok=$([ "$status" -ge 200 ] && [ "$status" -lt 300 ] && echo true || echo false)
  # 999 (LinkedIn) and 403 are usually bot walls, not dead links — flag for manual check.
  note=""
  if [ "$status" -eq 999 ] || [ "$status" -eq 403 ]; then
    note="likely bot-blocked, not necessarily broken — verify manually"
  fi
  results=$(jq --arg url "$url" --argjson status "$status" --argjson ok "$ok" --arg final "$final" --arg note "$note" \
      '. + [{url: $url, status: $status, ok: $ok, final_url: $final} + (if $note == "" then {} else {note: $note} end)]' <<<"$results")
done

echo "$results" > "$OUT"
total=$(jq 'length' <<<"$results")
broken=$(jq '[.[] | select(.ok | not)] | length' <<<"$results")
echo "checked $total URL(s), $broken broken — report at $OUT"
[ "$broken" -eq 0 ]
