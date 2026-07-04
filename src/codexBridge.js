import fs from "node:fs";
import path from "node:path";

import { buildAiPacket, createProject, importProject, serializeProject } from "./core.js";

export function ensureBridgeProjectFile(options = {}) {
  const filePath = path.resolve(options.filePath || path.join(process.cwd(), ".codex", "project.json"));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const created = !fs.existsSync(filePath);
  if (created) {
    fs.writeFileSync(filePath, serializeProject(createProject(options.project || {})));
  }
  return { filePath, created };
}

export function readBridgeProject(filePath) {
  return importProject(fs.readFileSync(path.resolve(filePath), "utf8"));
}

export function writeBridgeProject(filePath, input = {}) {
  const resolved = path.resolve(filePath);
  const current = fs.existsSync(resolved) ? readBridgeProject(resolved) : createProject();
  const next = createProject({ ...current, ...input });
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, serializeProject(next));
  return next;
}

export function buildBridgePacket(filePath, task = "剧本诊断", templateIds = []) {
  const project = readBridgeProject(filePath);
  const packet = buildAiPacket(project, task, { templateIds });
  return {
    ...packet,
    templates: packet.context?.templates || [],
    context: {
      ...packet.context,
      project: {
        id: project.id,
        title: project.title,
        writingType: project.writingType,
      },
    },
  };
}

export function parseDevServerUrl(logText = "") {
  const match = String(logText).match(/https?:\/\/127\.0\.0\.1:\d+\//);
  return match ? match[0] : null;
}
