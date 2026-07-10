# Personal Screenwriter / 编剧助手

Local-first screenwriting workspace for screenplay, literary-screenplay, adaptation notes, relationship walls, and Codex-assisted Script Doctor workflows.

Hosted app: https://732642856.github.io/wangzhan/

## Features

- 剧本 / 文学剧本双模式
- Script Doctor diagnosis packets for Codex
- AI Copilot task cards with copy/paste workflow
- Scene navigation, notes, tags, shot plan, and relationship wall
- Local browser storage; no server account required
- `.json`, `.fountain`, and `.fdx` import/export
- Optional Codex skill and MCP bridge for local advanced use

## Quick Start

```bash
git clone https://github.com/732642856/wangzhan.git
cd wangzhan
npm ci
npm run dev
```

Open the URL printed by Vite.

## Verify

```bash
npm test
npm run build
```

## Use With Codex

Install the skill from this repo:

```bash
mkdir -p ~/.codex/skills
cp -R skills/personal-screenwriter-codex ~/.codex/skills/
```

Open a new Codex task and say:

```text
使用 $personal-screenwriter-codex 打开编剧助手
使用 $personal-screenwriter-codex 检查项目进度
使用 $personal-screenwriter-codex 运行 Script Doctor 诊断
```

Local app helper:

```bash
npm run codex:ensure-server
```

Local MCP bridge:

```bash
npm run codex:mcp
```

MCP tools:

- `ensure_server`
- `open_app`
- `get_project`
- `set_project`
- `build_ai_packet`
- `export_project`

## Privacy

The hosted app is static and stores project data in the browser. The default Codex workflow does not require an API key.

If you connect a model provider, keep keys local and do not commit them. Private ebook/OCR outputs are ignored by git; keep copyrighted source text out of the repo.

## Deploy

GitHub Pages deploys from this repo. See [DEPLOY.md](DEPLOY.md) for a generic deploy checklist.

## License

MIT. See [LICENSE](LICENSE).
