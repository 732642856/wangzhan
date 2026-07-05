---
name: personal-screenwriter-codex
description: Use when the user wants to open, inspect, update, export, or build AI packets from the local Personal Screenwriter project inside Codex.
---

# Personal Screenwriter Codex

Use this skill when the user wants to work with the local Personal Screenwriter project as a Codex-native tool instead of only using the browser UI.

## What To Use

- `personal-screenwriter_ensure_server` to start or reuse the local app
- `personal-screenwriter_open_app` to get the local URL
- `personal-screenwriter_get_project` to read the bridge project json
- `personal-screenwriter_set_project` to write project updates
- `personal-screenwriter_build_ai_packet` to build an AI prompt packet
- `personal-screenwriter_export_project` to export full project json

## Codex-Only Commands

- If the user says "打开编剧助手" or "打开工作台", call `open_app` and give the returned local URL.
- If the user says "运行诊断" without pasting a task, call `build_ai_packet` with a script-doctor task, then answer the packet directly in chat.
- If the user pastes a Copilot task card or says "执行这个任务", treat the pasted task as the AI packet and return a structured diagnosis or rewrite for pasting back into the app.
- If the user asks to save or update project data from chat, use `get_project` first, then `set_project` with the smallest partial project update.

## Rules

- Prefer MCP tools for project reads/writes over editing `.codex/project.json` by hand.
- Use the browser UI for rich editor interaction.
- Use `build_ai_packet` when the user wants a reusable AI task payload.
- Keep edits scoped to screenplay, literary-screenplay, notes, tags, and writing workflow data.
