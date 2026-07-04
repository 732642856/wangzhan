#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseDevServerUrl } from "../src/codexBridge.js";

const projectDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const logPath = path.join(projectDir, ".codex", "dev-server.log");

function readLog() {
  return fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function probeUrl(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    const client = String(url).startsWith("https:") ? https : http;
    const request = client.get(url, { timeout: timeoutMs }, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

export async function ensureDevServer() {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const existingUrl = parseDevServerUrl(readLog());
  if (existingUrl && (await probeUrl(existingUrl))) return { url: existingUrl, reused: true };
  if (existingUrl) fs.writeFileSync(logPath, "");

  const child = spawn("npm", ["run", "dev"], {
    cwd: projectDir,
    detached: true,
    stdio: ["ignore", fs.openSync(logPath, "a"), fs.openSync(logPath, "a")],
  });
  child.unref();

  for (let index = 0; index < 40; index += 1) {
    await sleep(250);
    const url = parseDevServerUrl(readLog());
    if (url) return { url, reused: false, pid: child.pid };
  }
  throw new Error(`Dev server did not start. Check ${logPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await ensureDevServer();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
