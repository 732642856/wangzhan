#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { buildBridgePacket, ensureBridgeProjectFile, readBridgeProject, writeBridgeProject } from "../src/codexBridge.js";
import { ensureDevServer } from "../scripts/ensure-dev-server.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultProjectFile = path.join(projectRoot, ".codex", "project.json");

const server = new McpServer({ name: "personal-screenwriter", version: "0.1.0" });

const filePathArg = z.string().optional().describe("Optional absolute project json path. Defaults to personal-screenwriter/.codex/project.json");

server.registerTool(
  "ensure_server",
  {
    title: "Ensure personal-screenwriter app server",
    description: "Start or reuse the local Personal Screenwriter web app and return its URL.",
    inputSchema: {},
    outputSchema: {
      url: z.string(),
      reused: z.boolean(),
      pid: z.number().optional(),
    },
  },
  async () => {
    const result = await ensureDevServer();
    return {
      content: [{ type: "text", text: result.url }],
      structuredContent: result,
    };
  },
);

server.registerTool(
  "open_app",
  {
    title: "Get app URL",
    description: "Alias of ensure_server for opening the Personal Screenwriter app.",
    inputSchema: {},
    outputSchema: {
      url: z.string(),
      reused: z.boolean(),
      pid: z.number().optional(),
    },
  },
  async () => {
    const result = await ensureDevServer();
    return {
      content: [{ type: "text", text: result.url }],
      structuredContent: result,
    };
  },
);

server.registerTool(
  "get_project",
  {
    title: "Read project",
    description: "Read the current Personal Screenwriter project json from disk.",
    inputSchema: { filePath: filePathArg },
    outputSchema: {
      filePath: z.string(),
      project: z.record(z.any()),
    },
  },
  ({ filePath }) => {
    const ensured = ensureBridgeProjectFile({ filePath: filePath || defaultProjectFile });
    const project = readBridgeProject(ensured.filePath);
    return {
      content: [{ type: "text", text: JSON.stringify({ filePath: ensured.filePath, title: project.title }, null, 2) }],
      structuredContent: { filePath: ensured.filePath, project },
    };
  },
);

server.registerTool(
  "set_project",
  {
    title: "Write project",
    description: "Merge project updates into the Personal Screenwriter bridge file.",
    inputSchema: {
      filePath: filePathArg,
      project: z.record(z.any()).describe("Partial project object to merge."),
    },
    outputSchema: {
      filePath: z.string(),
      project: z.record(z.any()),
    },
  },
  ({ filePath, project }) => {
    const ensured = ensureBridgeProjectFile({ filePath: filePath || defaultProjectFile });
    const next = writeBridgeProject(ensured.filePath, project || {});
    return {
      content: [{ type: "text", text: JSON.stringify({ filePath: ensured.filePath, title: next.title }, null, 2) }],
      structuredContent: { filePath: ensured.filePath, project: next },
    };
  },
);

server.registerTool(
  "build_ai_packet",
  {
    title: "Build AI packet",
    description: "Build an AI writing packet from the current bridge project.",
    inputSchema: {
      filePath: filePathArg,
      task: z.string().optional(),
      templateIds: z.array(z.string()).optional(),
    },
    outputSchema: {
      task: z.string(),
      prompt: z.string(),
      templates: z.array(z.any()),
      context: z.record(z.any()),
    },
  },
  ({ filePath, task, templateIds }) => {
    const ensured = ensureBridgeProjectFile({ filePath: filePath || defaultProjectFile });
    const packet = buildBridgePacket(ensured.filePath, task || "剧本诊断", templateIds || []);
    return {
      content: [{ type: "text", text: packet.prompt }],
      structuredContent: packet,
    };
  },
);

server.registerTool(
  "export_project",
  {
    title: "Export project json",
    description: "Return the bridge project json text for backup or import elsewhere.",
    inputSchema: { filePath: filePathArg },
    outputSchema: {
      filePath: z.string(),
      json: z.string(),
    },
  },
  ({ filePath }) => {
    const ensured = ensureBridgeProjectFile({ filePath: filePath || defaultProjectFile });
    const json = JSON.stringify(readBridgeProject(ensured.filePath), null, 2);
    return {
      content: [{ type: "text", text: json }],
      structuredContent: { filePath: ensured.filePath, json },
    };
  },
);

await server.connect(new StdioServerTransport());
