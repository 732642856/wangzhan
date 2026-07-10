# Ebook Library Ingest

Use this guide when connecting a private ebook library to Personal Screenwriter.

## Source Files

Keep source files outside git. Recommended local inputs:

- `ebook-index.csv`: title, author, format, path, category, notes
- `ebook-summaries.docx`: short user-written summaries

## Ingest Rule

Do not put full ebook text into the app. Use the library as a local index: source pointer, category, working summary, and writing-mode hint.

不要把电子书全文导入项目；先做可检索索引和写作模式提示，再按需打开本机原文件。

## Tiers

### A类：编剧方法

Use for Script Doctor and AI packet templates:

- Screenplay, beat, reversal, character, dialogue, and outline files.
- Short-drama method files.
- Novel-to-screenplay adaptation files.
- High-signal lecture notes or user-authored summaries.

### B类：素材库

Use as topic and worldbuilding index, not method rules:

- Myth, folklore, history, war, crime, psychology, sociology, and biography.
- Suitable outputs: story seed, case premise, relationship secret, family myth, world pressure, location clue.

### C类：只保留索引

Keep searchable but do not prioritize:

- Duplicate rows.
- Metadata-noisy scan fragments.
- Files marked `待核实` until title and author are confirmed.

## Product Use

Right-side Script Doctor can expose knowledge modes:

- 结构诊断
- 韩式短剧
- 小说改编
- 对白润色
- 人物关系
- 题材素材

Mode switching should reuse template/preset controls instead of importing full ebook text.
