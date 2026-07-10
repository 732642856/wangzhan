---
name: personal-screenwriter-codex
description: Use when working on the local Personal Screenwriter / 编剧助手 project: open the workbench, inspect progress, run tests/build, create or execute Script Doctor/Copilot packets, handle knowledge modes/source pointers, verify UI parity, or sync the GitHub Pages repo.
---

# Personal Screenwriter Codex

Use this skill as the Codex entry point for the local 编剧助手 project.

## Project Locations

- Local app: `/Users/wuyongnaren/Documents/编剧助手/personal-screenwriter`
- Cloud worktree: `/tmp/wangzhan-m25`
- GitHub repo: `https://github.com/732642856/wangzhan`
- Public app: `https://732642856.github.io/wangzhan/`

Prefer the current directory when its `package.json` name is `personal-screenwriter`; otherwise use the local app path above.

## First Checks

Before UI, Laper-parity, acceptance, or deploy work:

1. Read `AGENTS.md`.
2. Read `docs/acceptance-error-log.md`.
3. Use `rg` / `rg --files` for search.
4. Keep edits small and focused.

Do not commit `node_modules/`, `dist/`, `.codex/`, `.serena/`, `.playwright-cli/`, `reports/`, or full ebook text.

## Common Commands

Run from the local app directory unless noted.

- Open/reuse app: `npm run codex:ensure-server`
- Dev server: `npm run dev`
- Tests: `npm test`
- Build: `npm run build`
- MCP server: `npm run codex:mcp`

If MCP tools are available, prefer:

- `personal-screenwriter_ensure_server`
- `personal-screenwriter_open_app`
- `personal-screenwriter_get_project`
- `personal-screenwriter_set_project`
- `personal-screenwriter_build_ai_packet`
- `personal-screenwriter_export_project`

## Codex Usage

- “打开编剧助手” / “打开工作台”: start or reuse the app and return the local URL.
- “检查进度”: read docs, tests, recent reports, git status, then report done/pending/blocked.
- “运行诊断”: build or infer a Script Doctor packet, execute it in chat, and return paste-ready cards.
- “执行这个任务”: treat the pasted Copilot/Script Doctor task as the AI packet and answer in the expected card format.
- “保存/更新项目”: read project state first, then write the smallest safe update.

Current default AI mode is no API key: the web app creates task packets, Codex executes them in chat, and the user pastes/imports the answer back. Only use API/Fable mode when the user supplies a key.

## Knowledge Rules

Use local knowledge as index/rules/source pointers, not as published full text.

- Read `docs/book-learning-notes.md` for available assets.
- Read `docs/ebook-library-ingest.md` for ebook tiers and mode routing.
- Main ebook index files:
  - `/Users/wuyongnaren/WorkBuddy/2026-07-07-18-13-34/电子书完整清单.csv`
  - `/Users/wuyongnaren/WorkBuddy/2026-07-07-18-13-34/电子书清单与中文简介汇总.docx`
- Never import all 8746 ebooks into the app.
- When copying a source pointer, include the source file, tracking doc, and rule: use summaries/rules/locations only.

## UI Acceptance

For user-visible UI changes, do more than token checks:

- Verify the workflow control exists and is usable.
- Run `npm test`.
- Run `npm run build`.
- For visual parity claims, inspect the app in a browser at 1280x720 and check DOM rects/no overflow.
- Save reports/screenshots under `reports/`, but do not commit them unless the user asks.

## Cloud Sync

Before syncing, verify the cloud worktree:

```bash
test -d /tmp/wangzhan-m25/.git && test -f /tmp/wangzhan-m25/package.json
```

If missing, reclone `https://github.com/732642856/wangzhan` into `/tmp/wangzhan-m25`.

Sync related surfaces together, then test in `/tmp/wangzhan-m25`:

```bash
rsync -a --delete src/ /tmp/wangzhan-m25/src/
rsync -a --delete tests/ /tmp/wangzhan-m25/tests/
rsync -a --delete docs/ /tmp/wangzhan-m25/docs/
rsync -a --delete skills/ /tmp/wangzhan-m25/skills/
npm test
npm run build
```

For a fresh clone, run `npm ci` before tests. After push, check both `ci` and `deploy-pages`; Pages deploy success is separate from build success.

## Skill Maintenance

When this skill changes:

1. Update this repo copy: `skills/personal-screenwriter-codex/SKILL.md`.
2. Update local install: `/Users/wuyongnaren/.codex/skills/personal-screenwriter-codex/SKILL.md`.
3. If the personal plugin cache exists, update its copy too.
4. Verify frontmatter has `name` and `description`.
