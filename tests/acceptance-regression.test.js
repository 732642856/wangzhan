import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const agentsSource = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
const errorLog = readFileSync(new URL("../docs/acceptance-error-log.md", import.meta.url), "utf8");

test("work starts by reading the acceptance error log", () => {
  assert.match(agentsSource, /docs\/acceptance-error-log\.md/);
  assert.match(agentsSource, /Before work/i);
  assert.match(errorLog, /## Work rule/);
  assert.match(errorLog, /Read this file before changing UI or acceptance tests/);
});

test("acceptance error log records recurring UI and deployment failures", () => {
  for (const incident of [
    "Static chat that looked right but could not be used",
    "Visual screenshot/DOM mismatch",
    "GitHub Pages deploy step can fail after upload succeeds",
    "Token-only tests missed UX regressions",
    "Fresh cloud clone needs dependencies before tests",
  ]) {
    assert.match(errorLog, new RegExp(incident));
  }
});

test("right Copilot panel is a usable chat workflow, not static chrome", () => {
  for (const token of [
    "id=\"laperChatInput\"",
    "id=\"laperChatRun\"",
    "id=\"laperChatCopy\"",
    "state.doctorReport?.findings",
    "studio.generateScriptDoctorReport()",
    "copyAiPacket()",
    "flash(\"诊断已生成\")",
    ".laper-chat-input",
    "min-height: 70px",
    "grid-template-columns: 24px 1fr 42px",
  ]) {
    assert.match(`${appSource}\n${stylesSource}`, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
