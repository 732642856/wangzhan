# Personal Screenwriter

Cloud-ready writing workspace for screenplay and literary-screenplay work.

This repo now supports two modes:

- hosted web app
- local advanced mode with Codex plugin and MCP bridge

## Hosted Web

The hosted app is a static Vite site. Users can open a URL and use:

- 剧本 / 文学剧本双模式
- 写作台与改编分场台
- AI 模板、规则卡、工作流预设
- 标题页、场景导航、Note / Tag、Shot Plan
- 本地浏览器存储
- `.json` / `.fountain` / `.fdx` 导入导出

Hosted mode does **not** require:

- Codex plugin
- MCP bridge
- local filesystem access

## One-Click Deploy

### GitHub Pages

Push the `personal-screenwriter` branch. The `pages` workflow builds `dist/` and deploys it with GitHub Pages.

### Vercel

1. Push this folder to a git host as its own repo
2. In Vercel, click **Add New → Project**
3. Import the repo
4. Deploy with defaults

This repo already includes `vercel.json`, so Vercel can build it as a static Vite app.

See [DEPLOY.md](/Users/wuyongnaren/Documents/编剧助手/personal-screenwriter/DEPLOY.md) for the standalone repo and publish checklist.

Quick local export:

```bash
npm run export:cloud
```

## Local Development

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Verification

```bash
npm test -- --runInBand
npm run build
```

## Local Advanced Mode

These features are local-only. They are not part of the hosted web deployment.

### One-Click Local App Start

```bash
npm run codex:ensure-server
```

### Local MCP Bridge

```bash
npm run codex:mcp
```

Tools:

- `ensure_server`
- `open_app`
- `get_project`
- `set_project`
- `build_ai_packet`
- `export_project`

### Local Codex Plugin

```bash
mkdir -p ~/plugins
ln -sfn "$PWD" ~/plugins/personal-screenwriter
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/update_plugin_cachebuster.py" "$PWD"
python3 - <<'PY'
import json
from pathlib import Path

marketplace_path = Path.home() / ".agents" / "plugins" / "marketplace.json"
marketplace_path.parent.mkdir(parents=True, exist_ok=True)
if marketplace_path.exists():
    payload = json.loads(marketplace_path.read_text(encoding="utf-8"))
else:
    payload = {"name": "personal", "interface": {"displayName": "Personal"}, "plugins": []}
plugins = payload.setdefault("plugins", [])
entry = {
    "name": "personal-screenwriter",
    "source": {"source": "local", "path": "./plugins/personal-screenwriter"},
    "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
    "category": "Writing",
}
for index, current in enumerate(plugins):
    if isinstance(current, dict) and current.get("name") == "personal-screenwriter":
        plugins[index] = entry
        break
else:
    plugins.append(entry)
marketplace_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
PY
codex plugin add personal-screenwriter@personal
```

After install, open a new Codex thread so new skills/tools are visible there.

## Privacy Boundary

Cloud-ready default assets are now public-safe knowledge/workflow identifiers.

Private local machine paths are not required for hosted mode.

## SDK Embedding

Other apps can embed the writing core through `src/sdk.js`.
