# OCR Knowledge Index

Date: 2026-06-30

This directory contains private local OCR/text assets for the personal screenwriting product. Use these files as source material for summaries, rules, task cards and AI prompt context. Do not publish or embed full book text in the app bundle.

| Slug | Source | Method | Output |
|---|---|---|---|
| `perusal_selection_1` | `/Users/wuyongnaren/Desktop/拉片子  1  电影电视编剧讲义=Perusal of selection 1 Screenwriting discourse_14324935.pdf` | Apple Vision OCR, 341 pages, 180dpi | `knowledge/ocr/perusal_selection_1/full_ocr.txt` |
| `book_14544811` | `/Users/wuyongnaren/Desktop/14544811.pdf` (`拉片子 2：结构主义编剧法讲义`) | Apple Vision OCR, 332 pages, 180dpi | `knowledge/ocr/book_14544811/full_ocr.txt` |
| `dialogue_mckee_existing_txt` | `/Users/wuyongnaren/文件仓库/课程资料/剧作💻训练/《影视创作课程》/影视读物/对白：文字、舞台、银幕的言语行为艺术-罗伯特·麦基.txt` | Existing local TXT because desktop PDF is structurally broken | `knowledge/ocr/dialogue_mckee_existing_txt/full_ocr.txt` |

## Reusable OCR Command

```bash
OCR_DPI=180 ./scripts/ocr_pdf_pages.sh "/absolute/path/to/book.pdf" book_slug
```

The script stores one text file per page under `knowledge/ocr/<slug>/pages/`, then combines them into `knowledge/ocr/<slug>/full_ocr.txt`.

## Next Extraction Targets

- Convert `拉片子 1` into cards for dramatic structure, narrative structure, climax unity, transition scenes and episode-unit analysis.
- Convert `拉片子 2` into cards for theme concept, situation construction, plot layout, fractal/recursive structure and adaptation analysis.
- Convert McKee dialogue text into cards for verbal action, subtext, conflict balance, scene/dialogue relationship and dialogue revision defects.
