#!/usr/bin/env bash
# dossier-cache.sh — get/put a Phase 3 research dossier keyed by HTML topic.
#
# Usage:
#   dossier-cache.sh key <html-file>                 # prints the topic hash
#   dossier-cache.sh get <html-file>                 # prints cached JSON, or CACHE_MISS
#   dossier-cache.sh put <html-file> <json-file>     # stores JSON in the cache
#   dossier-cache.sh path <html-file>                # prints the cache file path
#
# The cache lives at ~/.cache/improve-quality/dossiers/<hash>.json by default.
# Entries are considered fresh for 14 days; older ones are treated as misses.
#
# Override defaults with:
#   IMPROVE_QUALITY_CACHE_DIR — cache directory
#   IMPROVE_QUALITY_TTL_DAYS  — freshness window in days

set -euo pipefail

CACHE_DIR="${IMPROVE_QUALITY_CACHE_DIR:-$HOME/.cache/improve-quality/dossiers}"
TTL_DAYS="${IMPROVE_QUALITY_TTL_DAYS:-14}"

topic_hash() {
  local html="$1"
  if [ ! -f "$html" ]; then
    echo "ERROR: file not found: $html" >&2
    return 2
  fi
  local title h1
  # grep -oE + sed instead of GNU-only grep -P, so the script also runs on BSD/macOS grep.
  title=$(grep -oE '<title[^>]*>[^<]+' "$html" 2>/dev/null | head -1 \
            | sed -E 's/^<title[^>]*>//' \
            | tr '[:upper:]' '[:lower:]' | tr -s '[:space:]' ' ' \
            | sed 's/^ //;s/ $//' || true)
  h1=$(grep -oE '<h1[^>]*>[^<]+' "$html" 2>/dev/null | head -1 \
         | sed -E 's/^<h1[^>]*>//' \
         | tr '[:upper:]' '[:lower:]' | tr -s '[:space:]' ' ' \
         | sed 's/^ //;s/ $//' || true)
  if [ -z "$title" ] && [ -z "$h1" ]; then
    echo "ERROR: no <title> or <h1> found in $html" >&2
    return 2
  fi
  printf '%s|%s' "$title" "$h1" | sha256sum | head -c 16
}

cache_path() {
  local html="$1"
  local hash
  hash=$(topic_hash "$html")
  echo "$CACHE_DIR/$hash.json"
}

cmd="${1:-}"
case "$cmd" in
  key)
    [ "$#" -ge 2 ] || { echo "Usage: $0 key <html-file>" >&2; exit 2; }
    topic_hash "$2"
    ;;
  path)
    [ "$#" -ge 2 ] || { echo "Usage: $0 path <html-file>" >&2; exit 2; }
    cache_path "$2"
    ;;
  get)
    [ "$#" -ge 2 ] || { echo "Usage: $0 get <html-file>" >&2; exit 2; }
    mkdir -p "$CACHE_DIR"
    cache_file=$(cache_path "$2")
    if [ -f "$cache_file" ] && [ -n "$(find "$cache_file" -mtime -"$TTL_DAYS" 2>/dev/null)" ]; then
      cat "$cache_file"
    else
      echo "CACHE_MISS"
    fi
    ;;
  put)
    [ "$#" -ge 3 ] || { echo "Usage: $0 put <html-file> <json-file>" >&2; exit 2; }
    [ -f "$3" ] || { echo "ERROR: dossier file not found: $3" >&2; exit 2; }
    mkdir -p "$CACHE_DIR"
    cache_file=$(cache_path "$2")
    cp "$3" "$cache_file"
    echo "STORED $cache_file"
    ;;
  *)
    echo "Usage: $0 {key|path|get|put} <html-file> [json-file]" >&2
    exit 2
    ;;
esac
