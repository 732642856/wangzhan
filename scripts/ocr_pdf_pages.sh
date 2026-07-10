#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: ocr_pdf_pages.sh <pdf-path> <slug> [start-page] [end-page]" >&2
  exit 2
fi

PDF_PATH="$1"
SLUG="$2"
START_PAGE="${3:-1}"
END_PAGE="${4:-}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OCR_SWIFT="$ROOT_DIR/scripts/ocr_vision.swift"
OCR_BIN="$ROOT_DIR/scripts/ocr_vision_bin"
PDFINFO_BIN="${PDFINFO_BIN:-$(command -v pdfinfo || true)}"
PDFTOPPM_BIN="${PDFTOPPM_BIN:-$(command -v pdftoppm || true)}"
OCR_DPI="${OCR_DPI:-180}"

OUT_DIR="$ROOT_DIR/knowledge/ocr/$SLUG"
PAGES_DIR="$OUT_DIR/pages"
TMP_DIR="$OUT_DIR/_tmp"
LOG_FILE="$OUT_DIR/ocr.log"
FULL_FILE="$OUT_DIR/full_ocr.txt"
META_FILE="$OUT_DIR/metadata.txt"

mkdir -p "$PAGES_DIR" "$TMP_DIR"

if [ -z "$PDFINFO_BIN" ] || [ -z "$PDFTOPPM_BIN" ]; then
  echo "Missing pdfinfo or pdftoppm. Install poppler or set PDFINFO_BIN/PDFTOPPM_BIN." >&2
  exit 1
fi

if [ -z "$END_PAGE" ]; then
  END_PAGE="$("$PDFINFO_BIN" "$PDF_PATH" | awk '/^Pages:/ {print $2; exit}')"
fi

if [ -z "$END_PAGE" ]; then
  echo "Could not determine page count for $PDF_PATH" >&2
  exit 1
fi

{
  echo "source=$PDF_PATH"
  echo "slug=$SLUG"
  echo "start_page=$START_PAGE"
  echo "end_page=$END_PAGE"
  echo "dpi=$OCR_DPI"
  echo "mode=${OCR_FAST:-0}"
  echo "started_at=$(date '+%Y-%m-%d %H:%M:%S %z')"
} > "$META_FILE"

echo "[$(date '+%H:%M:%S')] OCR $SLUG pages $START_PAGE-$END_PAGE at ${OCR_DPI}dpi" | tee -a "$LOG_FILE"

for PAGE in $(seq "$START_PAGE" "$END_PAGE"); do
  PAGE_PADDED="$(printf "%03d" "$PAGE")"
  TXT_FILE="$PAGES_DIR/page-$PAGE_PADDED.txt"
  IMG_FILE="$TMP_DIR/page-$PAGE_PADDED.png"

  if [ -s "$TXT_FILE" ]; then
    echo "[$(date '+%H:%M:%S')] skip page $PAGE_PADDED" | tee -a "$LOG_FILE"
    continue
  fi

  rm -f "$TMP_DIR"/render-*.png "$IMG_FILE"
  "$PDFTOPPM_BIN" -f "$PAGE" -l "$PAGE" -r "$OCR_DPI" -png "$PDF_PATH" "$TMP_DIR/render" >/dev/null
  RENDERED="$(find "$TMP_DIR" -maxdepth 1 -name 'render-*.png' -print -quit)"
  if [ -z "$RENDERED" ]; then
    echo "[$(date '+%H:%M:%S')] render failed page $PAGE_PADDED" | tee -a "$LOG_FILE"
    continue
  fi
  mv "$RENDERED" "$IMG_FILE"

  if [ -x "$OCR_BIN" ]; then
    "$OCR_BIN" "$IMG_FILE" "$TXT_FILE.tmp"
  else
    /usr/bin/swift "$OCR_SWIFT" "$IMG_FILE" "$TXT_FILE.tmp"
  fi
  mv "$TXT_FILE.tmp" "$TXT_FILE"
  rm -f "$IMG_FILE"

  BYTES="$(wc -c < "$TXT_FILE" | tr -d ' ')"
  echo "[$(date '+%H:%M:%S')] page $PAGE_PADDED -> ${BYTES} bytes" | tee -a "$LOG_FILE"
done

: > "$FULL_FILE"
for TXT in "$PAGES_DIR"/page-*.txt; do
  [ -e "$TXT" ] || continue
  BASENAME="$(basename "$TXT" .txt)"
  PAGE_NUMBER="${BASENAME#page-}"
  {
    echo
    echo "===== Page $PAGE_NUMBER ====="
    echo
    cat "$TXT"
  } >> "$FULL_FILE"
done

{
  echo "finished_at=$(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "page_files=$(find "$PAGES_DIR" -maxdepth 1 -name 'page-*.txt' | wc -l | tr -d ' ')"
  echo "full_ocr_bytes=$(wc -c < "$FULL_FILE" | tr -d ' ')"
} >> "$META_FILE"

rm -rf "$TMP_DIR"
echo "[$(date '+%H:%M:%S')] done $SLUG -> $FULL_FILE" | tee -a "$LOG_FILE"
