import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const viteConfigSource = readFileSync(new URL("../vite.config.js", import.meta.url), "utf8");

test("M1 shell exposes a Laper-style professional workbench", () => {
  for (const token of [
    "professional-shell",
    "project-database",
    "script-doctor",
    "剧本数据库",
    "Script Doctor",
    "Characters",
    "Locations",
    "Props",
    "Beats",
    "Frames",
    "Relations",
    "Assets",
    "project-list",
    "一键生成诊断",
    "doctor-report",
    "doctor-action-list",
    "发送到任务",
    "生成草案",
    "Rewrite draft",
    "rewrite-draft",
    "复制交付包",
    "下载交付包",
    "Breakdown board",
    "关系墙",
    "breakdown-card",
  ]) {
    assert.match(`${appSource}\n${stylesSource}`, new RegExp(token));
  }
});

test("GitHub Pages build uses relative asset URLs", () => {
  assert.match(viteConfigSource, /base:\s*["']\.\//);
});
