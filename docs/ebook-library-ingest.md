# Ebook Library Ingest

Source files:

- `/Users/wuyongnaren/WorkBuddy/2026-07-07-18-13-34/电子书完整清单.csv`
- `/Users/wuyongnaren/WorkBuddy/2026-07-07-18-13-34/电子书清单与中文简介汇总.docx`

## Snapshot

- Candidate ebook files: 8746
- Approximate unique titles after dedupe: 4189
- Chinese summaries generated in the docx: 3007
- Main formats: PDF 7438, RTF 1070, TXT 179, EPUB 45
- Many entries are duplicates, restored-number files, or metadata-noisy scan fragments.

## Ingest rule

Do not put full text from 8746 files into the app. Use the library as a local index: source pointer, category, working summary, and writing-mode hint.
不要把 8746 个文件全文导入项目；先做可检索索引和写作模式提示，再按需打开本机原文件。

## Tiers

### A类：立即进入编剧助手知识库

Use for Script Doctor and AI packet templates:

- Korean screenwriting and short-drama method files.
- Screenplay, beat, reversal, character, dialogue and outline files.
- Novel-to-screenplay adaptation files.
- Existing high-signal TXT lecture notes already extracted under WorkBuddy.

Initial landed templates:

- `ebook-screenwriting-index`
- `ebook-adaptation-index`
- `ebook-material-index`

Initial landed presets:

- `ebook-korean-shortdrama`
- `ebook-novel-adaptation`
- `ebook-material-mining`

### B类：素材库

Use as topic and worldbuilding index, not method rules:

- Myth, folklore, history, war, crime, psychology, sociology and biography.
- Suitable outputs: story seed, case premise, relationship secret, family myth, world pressure, location clue.

### C类：只保留索引

Keep searchable but do not prioritize:

- Duplicate rows.
- `file000xxx`, `Group 1`, restored-number files.
- Entries with only technical/cache/source-code meaning.
- Files marked `待核实` until title and author are confirmed.

## Product use

Right-side Script Doctor can expose knowledge modes:

- 结构诊断
- 韩式短剧
- 小说改编
- 对白润色
- 人物关系
- 题材素材

The current implementation lands the backend knowledge modes first. UI mode switching can reuse existing template/preset controls instead of importing full ebook text.
