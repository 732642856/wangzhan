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
    "Assets",
  ]) {
    assert.match(`${appSource}\n${stylesSource}`, new RegExp(token));
  }
});

test("GitHub Pages build uses relative asset URLs", () => {
  assert.match(viteConfigSource, /base:\s*["']\.\//);
});
