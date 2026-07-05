#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-$HOME/Documents/personal-screenwriter-cloud}"

mkdir -p "$TARGET_DIR"

rsync -av --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  --exclude .codex \
  --exclude .serena \
  "$SOURCE_DIR/" \
  "$TARGET_DIR/"

if [ ! -d "$TARGET_DIR/.git" ]; then
  git -C "$TARGET_DIR" init >/dev/null
  git -C "$TARGET_DIR" branch -M main >/dev/null
fi

git -C "$TARGET_DIR" add .

if ! git -C "$TARGET_DIR" diff --cached --quiet; then
  if git config user.name >/dev/null 2>&1 && git config user.email >/dev/null 2>&1; then
    git -C "$TARGET_DIR" commit -m "Initial cloud-ready personal-screenwriter" >/dev/null
  else
    printf 'Skipped commit: git user.name/user.email not set\n' >&2
  fi
fi

printf '%s\n' "$TARGET_DIR"
