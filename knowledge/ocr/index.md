# OCR Knowledge Index

This directory is for private local OCR/text assets used by Personal Screenwriter.

Only this index is tracked. Full OCR outputs are ignored by git:

- `knowledge/ocr/<slug>/pages/`
- `knowledge/ocr/<slug>/full_ocr.txt`
- `knowledge/ocr/<slug>/metadata.txt`

## Reusable OCR Command

```bash
OCR_DPI=180 ./scripts/ocr_pdf_pages.sh "/absolute/path/to/book.pdf" book_slug
```

The script stores one text file per page under `knowledge/ocr/<slug>/pages/`, then combines them into `knowledge/ocr/<slug>/full_ocr.txt`.

## Extraction Targets

Use OCR outputs to make short rule cards, checklists, and prompt context. Do not commit source PDFs, private notes, or full copyrighted text.
