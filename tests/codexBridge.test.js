import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildBridgePacket,
  ensureBridgeProjectFile,
  parseDevServerUrl,
  readBridgeProject,
  writeBridgeProject,
} from "../src/codexBridge.js";
import { probeUrl } from "../scripts/ensure-dev-server.mjs";

test("ensureBridgeProjectFile creates a reusable project json when missing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "psw-bridge-"));
  const filePath = path.join(dir, "project.json");

  const result = ensureBridgeProjectFile({ filePath });

  assert.equal(fs.existsSync(filePath), true);
  assert.equal(result.created, true);
  assert.equal(result.filePath, filePath);
  assert.equal(readBridgeProject(filePath).schema, "personal-screenwriter.project.v1");
});

test("writeBridgeProject persists updates that readBridgeProject can load", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "psw-bridge-"));
  const filePath = path.join(dir, "project.json");
  ensureBridgeProjectFile({ filePath });

  const project = writeBridgeProject(filePath, {
    title: "桥接稿",
    writingType: "literary-screenplay",
    notes: "给 MCP 用",
  });

  assert.equal(project.title, "桥接稿");
  assert.equal(readBridgeProject(filePath).notes, "给 MCP 用");
});

test("buildBridgePacket reads a bridge project file and builds ai packet", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "psw-bridge-"));
  const filePath = path.join(dir, "project.json");
  writeBridgeProject(filePath, {
    title: "桥接稿",
    screenplayDoc: {
      type: "doc",
      content: [{ type: "sceneHeading", attrs: { id: "scene-1" }, content: [{ type: "text", text: "INT. 房间 - NIGHT" }] }],
    },
  });

  const packet = buildBridgePacket(filePath, "做场次诊断", ["scene-function"]);

  assert.equal(packet.task, "做场次诊断");
  assert.equal(packet.context.project.title, "桥接稿");
  assert.equal(packet.templates.length, 1);
});

test("parseDevServerUrl extracts local vite url from log output", () => {
  const url = parseDevServerUrl(`
  VITE v7.3.6 ready in 500 ms
  ➜  Local:   http://127.0.0.1:5174/
  `);

  assert.equal(url, "http://127.0.0.1:5174/");
});

test("probeUrl reports false for an unreachable local server", async () => {
  const alive = await probeUrl("http://127.0.0.1:9/", 200);
  assert.equal(alive, false);
});

test("fileURLToPath decodes Chinese workspace paths for local scripts", () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  assert.equal(root.includes("%E7"), false);
  assert.equal(root, path.dirname(path.resolve(fileURLToPath(import.meta.url), "..")));
});
