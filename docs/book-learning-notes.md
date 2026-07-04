# Book Learning Notes

Date: 2026-06-30

These notes track book assets for the personal local screenwriting product. The app must use summaries, rules, checklists and prompt templates rather than reproducing book text.

## PDFs Mentioned By User

| File | Status | Immediate Use |
|---|---|---|
| `/Users/wuyongnaren/Desktop/拉片子  1  电影电视编剧讲义=Perusal of selection 1 Screenwriting discourse_14324935.pdf` | Full rough OCR completed from 341 scanned pages. Output: `knowledge/ocr/perusal_selection_1/full_ocr.txt`; page files: `knowledge/ocr/perusal_selection_1/pages/`. | Ready for local rule-card extraction: screenwriting structure, scene analysis, dramatic/narrative structure, episode unit structure. |
| `/Users/wuyongnaren/Desktop/14544811.pdf` | Identified by OCR as `拉片子 2：结构主义编剧法讲义`. Full rough OCR completed from 332 scanned pages. Output: `knowledge/ocr/book_14544811/full_ocr.txt`; page files: `knowledge/ocr/book_14544811/pages/`. | Ready for local rule-card extraction: structuralist screenwriting method, theme/situation/plot fractal, adaptation analysis, scene construction. |
| `/Users/wuyongnaren/Desktop/对白：文字、舞台、银幕的言语行为艺术-罗伯特·麦基.pdf` | Desktop PDF has a broken catalog/root object, but a complete same-title TXT was found locally and copied into `knowledge/ocr/dialogue_mckee_existing_txt/full_ocr.txt`. | Ready for local dialogue/action rule-card extraction without repairing the broken PDF. |

## OCR Outputs Created

| Source | Pages / Lines / Bytes | Local Output |
|---|---:|---|
| `拉片子 1：电影电视编剧讲义` | 341 pages; 13,240 lines; 1,069,268 bytes | `knowledge/ocr/perusal_selection_1/full_ocr.txt` |
| `拉片子 2：结构主义编剧法讲义` | 332 pages; 14,084 lines; 903,098 bytes | `knowledge/ocr/book_14544811/full_ocr.txt` |
| `对白：文字、舞台、银幕的言语行为艺术` | Existing TXT; 3,456 lines; 439,758 bytes | `knowledge/ocr/dialogue_mckee_existing_txt/full_ocr.txt` |

## Existing WorkBuddy Text Assets Found

The WorkBuddy scan found already-extracted screenwriting notes that can be used immediately:

- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/北电编剧教材_完整版.md`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/02_剧本笔记_从头开始写一个故事.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/02_剧本笔记_人物塑造与故事结构四段呼应关系.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/02_剧本笔记_常用技巧与常见问题整理.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/02_剧本笔记_多主角与多线叙事.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/02_剧本笔记_单场戏设计原理.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/02_剧本笔记_剧作基础：叙事的科学（1-6）.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/01_11课_003.第三讲：人物小传的写作_原文.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/05_BFA教授课程_韩国编剧底层逻辑_原文.txt`
- `/Users/wuyongnaren/WorkBuddy/2026-06-19-13-14-04/bfa_extracted/02_剧本笔记_编剧创意来源与发展方法.txt`

## Product Rules Derived For The First App Version

- Treat books and lecture notes as private local knowledge assets.
- Use them to generate checklists and AI prompt context, not to publish or embed full copyrighted text.
- Track source paths in the asset panel so the user can open and inspect originals locally.
- OCR is now available as a reusable local utility through `scripts/ocr_pdf_pages.sh` and `scripts/ocr_vision.swift`.
