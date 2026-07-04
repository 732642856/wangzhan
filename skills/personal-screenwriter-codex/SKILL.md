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

## Rules

- Prefer MCP tools for project reads/writes over editing `.codex/project.json` by hand.
- Use the browser UI for rich editor interaction.
- Use `build_ai_packet` when the user wants a reusable AI task payload.
- Keep edits scoped to screenplay, literary-screenplay, notes, tags, and writing workflow data.
