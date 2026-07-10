# Book Learning Notes

These notes define how private local writing references may be used by the app.

## Rule

Use books, lecture notes, and ebook scans to create summaries, checklists, source pointers, and prompt context. Do not publish or commit full copyrighted text.

## Optional Local Assets

Users may keep private materials outside the repo, for example:

- `~/WritingLibrary/ebook-index.csv`
- `~/WritingLibrary/ebook-summaries.docx`
- `~/WritingLibrary/ocr/<slug>/full_ocr.txt`

Track only source pointers and derived rules in the app. Keep full source files local.

## Product Use

- Script Doctor may reference a knowledge mode such as structure, dialogue, adaptation, character, or material mining.
- A source pointer should name the user's local file or index row, not embed the original source text.
- OCR outputs under `knowledge/ocr/<slug>/` are ignored by git by default.

## Reusable OCR Utility

```bash
OCR_DPI=180 ./scripts/ocr_pdf_pages.sh "/absolute/path/to/book.pdf" book_slug
```

The command creates local output under `knowledge/ocr/<slug>/`. Review rights and licenses before using any text in public output.
