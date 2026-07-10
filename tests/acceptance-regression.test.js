import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const agentsSource = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
const errorLog = readFileSync(new URL("../docs/acceptance-error-log.md", import.meta.url), "utf8");
const ebookPlan = readFileSync(new URL("../docs/ebook-library-ingest.md", import.meta.url), "utf8");

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
    "Partial cloud sync left related source files stale",
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

test("ebook knowledge modes are inside the right Copilot chat, not buried in secondary tools", () => {
  const chatIndex = appSource.indexOf("laper-chat-card");
  const modesIndex = appSource.indexOf("laper-chat-mode-strip");
  const inputIndex = appSource.indexOf("laperChatInput");
  const aiUsageIndex = appSource.indexOf("AI usage");
  const toolsIndex = appSource.indexOf("AI tools");
  assert.ok(modesIndex > chatIndex);
  assert.ok(inputIndex > modesIndex);
  assert.ok(aiUsageIndex > modesIndex);
  assert.ok(toolsIndex > modesIndex);
  assert.match(stylesSource, /\.laper-chat-mode-strip/);
});

test("ebook knowledge mode buttons drive the AI packet templates", () => {
  const modeBlock = appSource.slice(appSource.indexOf("laper-chat-mode-strip"), appSource.indexOf("laperChatInput"));
  for (const token of ["data-template-ids", "data-ai-task"]) {
    assert.match(modeBlock, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const token of ["ebook-screenwriting-index", "ebook-adaptation-index", "ebook-material-index"]) {
    assert.match(appSource, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const handler = appSource.slice(
    appSource.indexOf('document.querySelectorAll("[data-knowledge-mode]")'),
    appSource.indexOf('document.querySelector("#laperChatInput")'),
  );
  assert.match(handler, /state\.selectedTemplateIds =/);
  assert.match(handler, /state\.aiTask =/);
  assert.match(handler, /render\(\)/);
});

test("right Copilot exposes active template sources before copying the packet", () => {
  const packetPreview = appSource.slice(appSource.indexOf("laperChatInput"), appSource.indexOf("laper-chat-composer"));
  for (const token of [
    "laper-template-source-list",
    "activeTemplateSources",
    "source",
  ]) {
    assert.match(packetPreview, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(appSource, /state\.selectedTemplateIds\.map/);
  assert.match(stylesSource, /\.laper-template-source-list/);
  assert.match(stylesSource, /max-height:\s*42px/);
});

test("right Copilot source pointers are clickable copy targets", () => {
  const packetPreview = appSource.slice(appSource.indexOf("laperChatInput"), appSource.indexOf("laper-chat-composer"));
  for (const token of [
    "laper-template-source-item",
    "data-source-pointer",
    "title",
    "source",
  ]) {
    assert.match(packetPreview, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const handler = appSource.slice(
    appSource.indexOf('document.querySelectorAll("[data-source-pointer]")'),
    appSource.indexOf('document.querySelector("#laperChatInput")'),
  );
  assert.match(handler, /navigator\.clipboard/);
  assert.match(handler, /sourcePointer/);
  assert.match(handler, /资料来源已复制/);
  assert.match(appSource, /formatSourcePointer/);
  assert.match(appSource, /docs\/ebook-library-ingest\.md/);
  assert.match(appSource, /不要全文导入/);
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

test("ebook library is landed as an index, not full-text ingestion", () => {
  for (const token of [
    "Keep source files outside git",
    "ebook-index.csv",
    "Do not put full ebook text into the app",
    "A类：编剧方法",
    "B类：素材库",
    "C类：只保留索引",
    "不要把电子书全文导入项目",
  ]) {
    assert.match(ebookPlan, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
