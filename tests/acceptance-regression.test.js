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
    "Temp cloud worktree may disappear between sessions",
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

test("right Copilot chat stays above secondary tool cards", () => {
  const chatIndex = appSource.indexOf("laper-chat-card");
  const aiUsageIndex = appSource.indexOf("AI usage");
  const toolsIndex = appSource.indexOf("AI tools");
  assert.ok(chatIndex > 0);
  assert.ok(aiUsageIndex > chatIndex);
  assert.ok(toolsIndex > chatIndex);
});

test("right Copilot Run and Copy handlers read user input before acting", () => {
  const runHandler = appSource.slice(
    appSource.indexOf('document.querySelector("#laperChatRun")'),
    appSource.indexOf('document.querySelector("#laperChatCopy")'),
  );
  assert.match(runHandler, /#laperChatInput/);
  assert.match(runHandler, /state\.aiTask =/);
  assert.match(runHandler, /studio\.generateScriptDoctorReport\(\)/);
  assert.match(runHandler, /render\(\)/);

  const copyHandler = appSource.slice(appSource.indexOf('document.querySelector("#laperChatCopy")'));
  assert.match(copyHandler, /#laperChatInput/);
  assert.match(copyHandler, /await copyAiPacket\(\)/);
});

test("acceptance error log gives executable cloud verification order", () => {
  assert.match(errorLog, /verify both `\.git` and `package\.json`/);
  assert.match(errorLog, /run `npm ci` before `npm test` and `npm run build`/);
});
