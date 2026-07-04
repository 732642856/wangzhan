import assert from "node:assert/strict";
import test from "node:test";
import { Compiler } from "inkjs/compiler/Compiler";

import {
  buildAiPacket,
  buildBreakdownBoard,
  buildDeliveryPacket,
  buildProjectCatalog,
  buildTextQualityReport,
  buildVisualDevelopmentPack,
  createProjectLibrary,
  compareVersions,
  checkInVersion,
  createVersionSnapshot,
  createProject,
  deleteShotPlanShot,
  exportFdx,
  exportFountain,
  extractAssetSeeds,
  importProjectLibrary,
  generateShotPlan,
  generateRewriteDraft,
  updateDoctorAction,
  getAiTaskPresets,
  getWritingWorkbenchDefaults,
  getWritingTypeConfig,
  generateScriptDoctorReport,
  getWorkflowPresets,
  getKnowledgeTemplates,
  buildStoryExplorer,
  addShotPlanShot,
  parseFountain,
  restoreVersion,
  serializeProjectLibrary,
  summarizeProject,
  summarizeShotPlan,
  updateShotPlanShot,
} from "../src/core.js";
import { runCompiledInkStory } from "../src/inkRuntime.js";
import { buildRelationshipFlow } from "../src/relationFlow.js";
import { createPersonalScreenwriter } from "../src/sdk.js";

test("parses Chinese Fountain cues into scenes, characters and dialogue", () => {
  const parsed = parseFountain(`Title: 星轨试写
Author: Personal Screenwriter

INT. 作家房间 - NIGHT

编剧
我们不再从空白页开始。

EXT. 天台 - DAWN

导演
让剧本自己长出场景、人物和镜头。`);

  assert.equal(parsed.title, "星轨试写");
  assert.equal(parsed.scenes.length, 2);
  assert.deepEqual(
    parsed.characters.map((character) => character.name),
    ["编剧", "导演"],
  );
  assert.equal(parsed.blocks.filter((block) => block.type === "dialogue").length, 2);
});
test("preserves tag field mappings in project snapshots and restore flow", () => {
  const studio = createPersonalScreenwriter({
    project: {
      tagFieldMappings: {
        writing: "turnType",
        character: "adaptationFunction",
        structure: "conflictGoal",
        emotion: "conflictGoal",
        relationship: "sourceReference",
        world: "conflictGoal",
      },
    },
  });
  const snapshotState = studio.createVersionSnapshot("映射稿");
  const versionId = snapshotState.project.versions[0].id;
  studio.setProject({
    ...studio.getState().project,
    tagFieldMappings: {
      ...studio.getState().project.tagFieldMappings,
      emotion: "exitChange",
    },
  });
  studio.restoreVersion(versionId);
  assert.equal(studio.getState().project.tagFieldMappings.emotion, "conflictGoal");
});

test("extractAssetSeeds keeps hosted defaults free of private local paths", () => {
  const seeds = extractAssetSeeds([
    { path: "knowledge://screenplay/scene-function", category: "story", score: 100 },
    { path: "workflow://novel-adaptation-film", category: "story", score: 95 },
  ]);

  assert.equal(seeds.length, 2);
  assert.equal(seeds.some((seed) => seed.path.includes("/Users/")), false);
  assert.equal(seeds[0].label, "scene-function");
});

test("builds a playable story explorer from scenes, choices, clues and relationships", () => {
  const project = createProject({
    title: "找到她",
    fountain: `INT. 档案室 - NIGHT

侦探
她不是失踪，她是在等我们找到规律。

朋友
那张照片里少了一个人。

EXT. 江边 - DAWN

侦探
规律在水边。`,
    bible: {
      characters: [
        { name: "侦探", role: "调查者", goal: "找出失踪案规律" },
        { name: "朋友", role: "证人", goal: "隐瞒照片来源" },
      ],
      locations: [{ name: "档案室", notes: "线索密集的室内场景" }],
      props: [{ name: "照片", notes: "关键线索" }],
      rules: [{ name: "只信证据", notes: "每次推进要绑定线索" }],
    },
  });

  const explorer = buildStoryExplorer(project);

  assert.equal(explorer.title, "找到她");
  assert.deepEqual(
    explorer.passages.map((passage) => passage.title),
    ["INT. 档案室 - NIGHT", "EXT. 江边 - DAWN"],
  );
  assert.equal(explorer.passages[0].choices[0].targetId, "scene-2");
  assert.equal(explorer.clues.some((clue) => clue.title === "照片"), true);
  assert.equal(explorer.relationships.nodes.some((node) => node.id === "character:侦探"), true);
  assert.equal(explorer.relationships.edges.some((edge) => edge.source === "character:侦探" && edge.target === "scene:scene-1"), true);
});

test("sdk exposes the story explorer for the app shell", () => {
  const studio = createPersonalScreenwriter({
    project: createProject({
      title: "探索 SDK",
      fountain: `INT. 房间 - NIGHT

人物
开始。`,
    }),
  });

  assert.equal(studio.buildStoryExplorer().title, "探索 SDK");
});

test("runs compiled Ink JSON through the inkjs runtime", () => {
  const storyJson = new Compiler(`入口。\n* 追线索\n  找到照片。\n`).Compile().ToJson();

  const start = runCompiledInkStory(storyJson);
  const next = runCompiledInkStory(storyJson, [0]);

  assert.deepEqual(start.choices.map((choice) => choice.text), ["追线索"]);
  assert.match(start.text, /入口/);
  assert.match(next.text, /找到照片/);
});

test("maps explorer relationships into React Flow nodes and edges", () => {
  const flow = buildRelationshipFlow({
    nodes: [
      { id: "character:侦探", label: "侦探", type: "character" },
      { id: "scene:scene-1", label: "档案室", type: "scene" },
    ],
    edges: [{ id: "侦探->scene-1", source: "character:侦探", target: "scene:scene-1", label: "出场" }],
  });

  assert.equal(flow.nodes[0].position.x, 0);
  assert.equal(flow.nodes[1].position.x, 220);
  assert.equal(flow.edges[0].animated, false);
});

test("summarizes screenplay project for immediate product dashboards", () => {
  const project = createProject({
    title: "找到她",
    fountain: `INT. 档案室 - NIGHT

侦探
她不是失踪，她是在等我们找到规律。

EXT. 江边 - DAWN

朋友
那张照片里少了一个人。`,
    bible: {
      characters: [{ name: "侦探", role: "主角", goal: "找出失踪案规律" }],
      locations: [{ name: "档案室", notes: "线索密集的室内场景" }],
    },
  });

  const summary = summarizeProject(project);

  assert.equal(summary.sceneCount, 2);
  assert.equal(summary.characterCount, 2);
  assert.equal(summary.locationCount, 2);
  assert.equal(summary.wordCount > 0, true);
});

test("exports Fountain, FDX and AI packets from one project object", () => {
  const project = createProject({
    title: "星轨试写",
    fountain: `INT. 作家房间 - NIGHT

编剧
我们不再从空白页开始。`,
  });

  assert.match(exportFountain(project), /INT\. 作家房间 - NIGHT/);
  assert.match(exportFdx(project), /<FinalDraft DocumentType="Script"/);
  assert.match(exportFdx(project), /<Paragraph Type="Character">/);

  const packet = buildAiPacket(project, "诊断连续性");
  assert.equal(packet.task, "诊断连续性");
  assert.match(packet.prompt, /你是一个资深编剧顾问/);
  assert.equal(packet.context.summary.sceneCount, 1);
});

test("preserves full title-page metadata when exporting fountain mirror", () => {
  const project = createProject({
    screenplayDoc: {
      type: "doc",
      content: [
        {
          type: "titlePage",
          attrs: {
            field: "title",
            tpTitle: "归档之夜",
            tpWrittenBy: "编剧甲",
            tpBasedOn: "同名小说",
            tpDraft: "Second Draft",
            tpDraftDate: "2026-06-30",
            tpContact: "writer@example.com",
            tpCopyright: "2026",
            tpWgaRegistration: "WGA-001",
            tpNotes: "仅内部使用",
            tpTitleFontSize: 18,
          },
          content: [{ type: "text", text: "归档之夜" }],
        },
      ],
    },
  });

  assert.match(project.fountain, /Title: 归档之夜/);
  assert.match(project.fountain, /Author: 编剧甲/);
  assert.match(project.fountain, /Credit: Based on 同名小说/);
  assert.match(project.fountain, /Draft date: 2026-06-30/);
  assert.match(project.fountain, /Contact: writer@example.com/);
});

test("extracts local asset seeds from scanned file records", () => {
  const seeds = extractAssetSeeds([
    {
      path: "/Users/wuyongnaren/Projects/星轨资料恢复/剧本/短剧剧本格式范例.docx",
      category: "screenplay",
      score: 88,
    },
    {
      path: "/Users/wuyongnaren/WorkBuddy/xingguigushi-repo/README.md",
      category: "project",
      score: 95,
    },
  ]);

  assert.equal(seeds.length, 2);
  assert.equal(seeds[0].label, "短剧剧本格式范例.docx");
  assert.equal(seeds[1].family, "星轨故事");
});

test("creates and restores screenplay version snapshots", () => {
  const project = createProject({
    title: "版本测试",
    fountain: `INT. 房间 - NIGHT

人物
第一版对白。`,
  });

  const withSnapshot = createVersionSnapshot(project, "第一版");
  const changed = createProject({
    ...withSnapshot,
    fountain: `INT. 房间 - NIGHT

人物
第二版对白。`,
  });
  const restored = restoreVersion(changed, withSnapshot.versions[0].id);

  assert.equal(withSnapshot.versions.length, 1);
  assert.equal(restored.fountain.includes("第一版对白"), true);
  assert.equal(restored.versions.length, 2);
  assert.equal(restored.versions[0].kind, "restore");
});

test("stores script notes and tags in project snapshots and restore flow", () => {
  const project = createProject({
    fountain: `INT. 档案室 - NIGHT

侦探
看这里。`,
    scriptNotes: [
      {
        id: "note-1",
        content: "补一条潜台词",
        color: "#f4d35e",
        anchorText: "看这里。",
        sceneId: "scene-1",
        elementType: "dialogue",
      },
    ],
    tagCategories: [{ id: "writing", name: "Writing", color: "#2f6f6d" }],
    tags: [{ id: "tag-1", categoryId: "writing", name: "线索", text: "看这里。", notes: "关键证据提示" }],
  });
  const snap = createVersionSnapshot(project, "带注释版本");
  const restored = restoreVersion(snap, snap.versions[0].id);

  assert.equal(restored.scriptNotes.length, 1);
  assert.equal(restored.tags.length, 1);
  assert.equal(restored.tagCategories.length, 1);
});

test("builds AI packets with selected writing knowledge templates", () => {
  const templates = getKnowledgeTemplates();
  const project = createProject({
    title: "模板测试",
    fountain: `INT. 档案室 - NIGHT

侦探
线索被藏在对白里。`,
  });
  const packet = buildAiPacket(project, "诊断场景", {
    templateIds: ["scene-function", "dialogue-action"],
  });

  assert.equal(templates.some((template) => template.id === "dialogue-action"), true);
  assert.match(packet.prompt, /单场戏功能/);
  assert.match(packet.prompt, /对白不是信息搬运/);
});

test("provides reuse-first AI task presets", () => {
  const presets = getAiTaskPresets();
  const doctor = presets.find((preset) => preset.id === "script-doctor");
  const character = presets.find((preset) => preset.id === "character-bible");

  assert.ok(doctor);
  assert.ok(character);
  assert.equal(doctor.templateIds.includes("scene-function"), true);
  assert.equal(character.templateIds.includes("character-arc"), true);
});

test("includes WorkBuddy-derived rule cards and task cards", () => {
  const templates = getKnowledgeTemplates();
  const presets = getAiTaskPresets();

  for (const id of ["beat-loop", "multi-line", "five-step-pipeline", "worldview-pressure", "character-20-questions"]) {
    assert.equal(templates.some((template) => template.id === id), true, `missing template ${id}`);
  }

  assert.equal(presets.some((preset) => preset.id === "beat-audit"), true);
  assert.equal(presets.some((preset) => preset.id === "worldview-audit"), true);
  assert.equal(presets.some((preset) => preset.id === "five-step-production"), true);
});

test("includes WorkBuddy genre and production rule cards", () => {
  const templates = getKnowledgeTemplates();
  const presets = getAiTaskPresets();

  for (const id of ["storyboard-continuity", "mystery-info-control", "folk-visual-redlines", "romance-subtext", "director-model-review", "dark-humor"]) {
    assert.equal(templates.some((template) => template.id === id), true, `missing template ${id}`);
  }

  for (const id of ["storyboard-brief", "mystery-doctor", "folk-adaptation", "romance-pass", "director-panel-review"]) {
    assert.equal(presets.some((preset) => preset.id === id), true, `missing preset ${id}`);
  }
});

test("includes book-derived screenwriting, perusal and dialogue rule cards", () => {
  const templates = getKnowledgeTemplates();

  for (const id of ["structuralist-screenwriting", "film-perusal-method", "verbal-action-dialogue"]) {
    assert.equal(templates.some((template) => template.id === id), true, `missing template ${id}`);
  }
});

test("includes book-derived task presets for structure, perusal and dialogue passes", () => {
  const presets = getAiTaskPresets();

  for (const id of [
    "structuralist-diagnosis",
    "perusal-breakdown",
    "dialogue-action-pass",
    "adaptation-fractal-pass",
    "scene-conflict-pass",
  ]) {
    assert.equal(presets.some((preset) => preset.id === id), true, `missing preset ${id}`);
  }
});

test("builds AI packets with book-derived template guidance", () => {
  const project = createProject({
    title: "书籍规则卡测试",
    fountain: `INT. 审讯室 - NIGHT

警察
你说的是事实，还是你希望我相信的事实？

嫌疑人
我只是把你想听的先给你。`,
  });

  const packet = buildAiPacket(project, "做结构与对白会诊", {
    templateIds: ["structuralist-screenwriting", "film-perusal-method", "verbal-action-dialogue"],
  });

  assert.match(packet.prompt, /结构主义编剧法/);
  assert.match(packet.prompt, /拉片方法/);
  assert.match(packet.prompt, /对白行动进攻/);
  assert.equal(packet.context.templates.length, 3);
});

test("compareVersions keeps duplicate lines and order-sensitive diff", () => {
  const base = createProject({
    fountain: `INT. 房间 - NIGHT

人物
我来了。

人物
我来了。`,
  });
  const withSnapshot = createVersionSnapshot(base, "v1");
  const changed = createProject({
    ...withSnapshot,
    fountain: `INT. 房间 - NIGHT

人物
我没来。

人物
我来了。`,
  });
  const diff = compareVersions(changed, withSnapshot.versions[0].id);

  assert.equal(diff.added.includes("我没来。"), true);
  assert.equal(diff.removed.includes("我来了。"), true);
});

test("includes scene-level diagnosis templates derived from the three books", () => {
  const templates = getKnowledgeTemplates();

  for (const id of [
    "opening-scene-diagnosis",
    "turning-scene-diagnosis",
    "climax-scene-diagnosis",
    "ending-scene-diagnosis",
  ]) {
    assert.equal(templates.some((template) => template.id === id), true, `missing template ${id}`);
  }
});

test("includes genre combination presets for mystery, romance and adaptation workflows", () => {
  const presets = getAiTaskPresets();

  for (const id of [
    "mystery-scene-pack",
    "romance-scene-pack",
    "adaptation-scene-pack",
  ]) {
    assert.equal(presets.some((preset) => preset.id === id), true, `missing preset ${id}`);
  }
});

test("builds AI packets with scene-level opening and climax guidance", () => {
  const project = createProject({
    title: "场景模板测试",
    fountain: `INT. 天台 - NIGHT

女孩
如果你现在转身，我就当今晚没发生过。

男孩
可我就是为了今晚才来的。`,
  });

  const packet = buildAiPacket(project, "检查开场和高潮场景", {
    templateIds: ["opening-scene-diagnosis", "climax-scene-diagnosis"],
  });

  assert.match(packet.prompt, /开场场景诊断/);
  assert.match(packet.prompt, /高潮场景诊断/);
  assert.match(packet.prompt, /开场必须同时交代情境起点/);
  assert.match(packet.prompt, /高潮场景要把动作、情感、命运或主题压到最强冲突点/);
});

test("genre combination presets wire book templates into scene workflows", () => {
  const presets = getAiTaskPresets();
  const mystery = presets.find((preset) => preset.id === "mystery-scene-pack");
  const romance = presets.find((preset) => preset.id === "romance-scene-pack");
  const adaptation = presets.find((preset) => preset.id === "adaptation-scene-pack");

  assert.ok(mystery);
  assert.ok(romance);
  assert.ok(adaptation);
  assert.equal(mystery.templateIds.includes("mystery-info-control"), true);
  assert.equal(mystery.templateIds.includes("turning-scene-diagnosis"), true);
  assert.equal(romance.templateIds.includes("romance-subtext"), true);
  assert.equal(romance.templateIds.includes("ending-scene-diagnosis"), true);
  assert.equal(adaptation.templateIds.includes("structuralist-screenwriting"), true);
  assert.equal(adaptation.templateIds.includes("opening-scene-diagnosis"), true);
});

test("exposes finished workflow presets for short-drama mystery, urban romance and novel adaptation film", () => {
  const workflows = getWorkflowPresets();

  for (const id of [
    "short-drama-mystery",
    "urban-romance",
    "novel-adaptation-film",
  ]) {
    assert.equal(workflows.some((workflow) => workflow.id === id), true, `missing workflow ${id}`);
  }
});

test("workflow presets include ordered stages and recommended task presets", () => {
  const workflows = getWorkflowPresets();
  const shortDrama = workflows.find((workflow) => workflow.id === "short-drama-mystery");
  const urbanRomance = workflows.find((workflow) => workflow.id === "urban-romance");
  const adaptation = workflows.find((workflow) => workflow.id === "novel-adaptation-film");

  assert.ok(shortDrama);
  assert.ok(urbanRomance);
  assert.ok(adaptation);

  assert.equal(shortDrama.stages.length >= 4, true);
  assert.equal(shortDrama.stages[0].taskPresetId, "mystery-scene-pack");
  assert.equal(shortDrama.stages.at(-1).taskPresetId, "storyboard-brief");

  assert.equal(urbanRomance.stages[0].taskPresetId, "romance-scene-pack");
  assert.equal(urbanRomance.stages.some((stage) => stage.taskPresetId === "character-bible"), true);

  assert.equal(adaptation.stages[0].taskPresetId, "adaptation-scene-pack");
  assert.equal(adaptation.stages.some((stage) => stage.taskPresetId === "adaptation-fractal-pass"), true);
});

test("workflow presets can be turned into AI packets stage by stage", () => {
  const project = createProject({
    title: "工作流测试",
    fountain: `INT. 审讯室 - NIGHT

警察
她失踪前最后见的人就是你。

嫌疑人
你确定你看到的是我，不是你想看到的人？`,
  });
  const workflows = getWorkflowPresets();
  const shortDrama = workflows.find((workflow) => workflow.id === "short-drama-mystery");
  const firstStage = shortDrama.stages[0];
  const preset = getAiTaskPresets().find((item) => item.id === firstStage.taskPresetId);

  const packet = buildAiPacket(project, {
    task: `${firstStage.title}: ${preset.task}`,
    templateIds: preset.templateIds,
  });

  assert.match(packet.prompt, /悬疑场景工作流/);
  assert.match(packet.prompt, /信息控制/);
  assert.equal(packet.context.templates.length >= 3, true);
});

test("supports OpenDraft-style version check-in with message and author", () => {
  const project = createProject({
    title: "版本语义测试",
    fountain: `INT. 房间 - NIGHT

人物
第一版。`,
  });

  const checkedIn = checkInVersion(project, "完成第一场改写", "编剧");

  assert.equal(checkedIn.versions.length, 1);
  assert.equal(checkedIn.versions[0].label, "完成第一场改写");
  assert.equal(checkedIn.versions[0].author, "编剧");
  assert.equal(checkedIn.versions[0].kind, "checkin");
});

test("compares two versions with added and removed lines", () => {
  let project = createProject({
    title: "版本对比测试",
    fountain: `INT. 房间 - NIGHT

人物
第一版对白。`,
  });

  project = checkInVersion(project, "第一版", "编剧");
  project = createProject({
    ...project,
    fountain: `INT. 房间 - NIGHT

人物
第二版对白。

人物
新增一句。`,
  });
  project = checkInVersion(project, "第二版", "编剧");

  const diff = compareVersions(project, project.versions[1].id, project.versions[0].id);

  assert.match(diff.summary, /新增 3 行/);
  assert.equal(diff.added.some((line) => line.includes("第二版对白")), true);
  assert.equal(diff.removed.some((line) => line.includes("第一版对白")), true);
});

test("restoring a version creates a restore entry without losing history", () => {
  let project = createProject({
    title: "恢复版本测试",
    fountain: `INT. 房间 - NIGHT

人物
原始版本。`,
  });

  project = checkInVersion(project, "初稿", "编剧");
  project = createProject({
    ...project,
    fountain: `INT. 房间 - NIGHT

人物
修改版本。`,
  });
  project = checkInVersion(project, "二稿", "编剧");
  const restored = restoreVersion(project, project.versions[1].id);

  assert.equal(restored.fountain.includes("原始版本"), true);
  assert.equal(restored.versions.length, 3);
  assert.equal(restored.versions[0].kind, "restore");
});

test("generates a text-only shot plan from parsed scenes", () => {
  const project = createProject({
    title: "镜头规划测试",
    fountain: `INT. 审讯室 - NIGHT
= 嫌疑人第一次松口

警察
你昨晚去了哪？

EXT. 江边 - DAWN
= 主角发现遗漏物证

侦探
脚印少了一组。`,
  });

  const next = generateShotPlan(project);

  assert.equal(next.shotPlan.shots.length, 2);
  assert.equal(next.shotPlan.shots[0].sceneId, "scene-1");
  assert.equal(next.shotPlan.shots[0].shotSize, "MS");
  assert.match(next.shotPlan.shots[0].goal, /嫌疑人第一次松口/);
});

test("supports adding, updating and deleting shot plan rows", () => {
  let project = createProject({
    title: "镜头编辑测试",
    fountain: `INT. 档案室 - NIGHT

侦探
先从旧案卷找规律。`,
  });

  project = generateShotPlan(project);
  project = addShotPlanShot(project, "scene-1");
  const added = project.shotPlan.shots.at(-1);
  assert.ok(added);

  project = updateShotPlanShot(project, added.id, {
    shotSize: "CU",
    movement: "PUSH",
    duration: 5,
    dialogue: "给旧卷宗一个近距离压力。",
  });

  const updated = project.shotPlan.shots.find((shot) => shot.id === added.id);
  assert.equal(updated.shotSize, "CU");
  assert.equal(updated.duration, 5);

  project = deleteShotPlanShot(project, added.id);
  assert.equal(project.shotPlan.shots.some((shot) => shot.id === added.id), false);
});

test("summarizes shot plan for writing-side handoff to StarCanvas", () => {
  let project = createProject({
    title: "镜头统计测试",
    fountain: `INT. 天台 - NIGHT

女孩
今晚之后我们就没有借口了。`,
  });

  project = generateShotPlan(project);
  project = updateShotPlanShot(project, project.shotPlan.shots[0].id, {
    duration: 7,
    shotSize: "CU",
  });

  const summary = summarizeShotPlan(project);

  assert.equal(summary.shotCount, 1);
  assert.equal(summary.totalDuration, 7);
  assert.equal(summary.byShotSize.CU, 1);
});

test("migrates a fountain-only project into screenplayDoc and preserves fountain mirror", () => {
  const project = createProject({
    fountain: `Title: 迁移测试

INT. 房间 - NIGHT

人物
对白。`,
  });

  assert.ok(project.screenplayDoc);
  assert.equal(typeof project.fountain, "string");
  assert.match(project.fountain, /INT\. 房间 - NIGHT/);
});

test("stores screenplayDoc in snapshots and restores it intact", () => {
  const project = createProject({
    fountain: `Title: 恢复测试

INT. 档案室 - NIGHT

侦探
线索在这里。`,
  });
  const snap = createVersionSnapshot(project, "第一版");
  const changed = createProject({
    ...snap,
    screenplayDoc: {
      type: "doc",
      meta: { fountain: "INT. 档案室 - NIGHT\n\n侦探\n第二版。" },
    },
  });
  const restored = restoreVersion(changed, snap.versions[0].id);

  assert.ok(restored.screenplayDoc);
  assert.deepEqual(restored.screenplayDoc, snap.versions[0].screenplayDoc);
});

test("sdk exposes setScreenplayDoc and keeps fountain in sync", () => {
  const writer = createPersonalScreenwriter({
    project: {
      fountain: `INT. 屋顶 - NIGHT

人物
第一句。`,
    },
  });

  const nextDoc = {
    type: "doc",
    meta: {
      fountain: `INT. 屋顶 - NIGHT

人物
第二句。`,
    },
  };

  writer.setScreenplayDoc(nextDoc);
  const state = writer.getState();

  assert.equal(state.project.screenplayDoc, nextDoc);
  assert.match(state.project.fountain, /第二句/);
});

test("creates projects with screenplay writingType by default", () => {
  const project = createProject();
  assert.equal(project.writingType, "screenplay");
});
test("creates projects with default tag field mappings", () => {
  const project = createProject();
  assert.equal(project.tagFieldMappings.writing, "turnType");
  assert.equal(project.tagFieldMappings.character, "adaptationFunction");
  assert.equal(project.tagFieldMappings.structure, "conflictGoal");
  assert.equal(project.tagFieldMappings.emotion, "exitChange");
  assert.equal(project.tagFieldMappings.relationship, "sourceReference");
  assert.equal(project.tagFieldMappings.world, "conflictGoal");
});

test("preserves writingType in project snapshots and restore flow", () => {
  const studio = createPersonalScreenwriter({
    project: {
      writingType: "literary-screenplay",
    },
  });
  const snapshotState = studio.createVersionSnapshot("文学稿");
  const versionId = snapshotState.project.versions[0].id;

  studio.setProject({
    ...studio.getState().project,
    writingType: "screenplay",
  });
  studio.restoreVersion(versionId);

  assert.equal(studio.getState().project.writingType, "literary-screenplay");
});

test("returns type-specific defaults for literary-screenplay and screenplay", () => {
  const literary = getWritingTypeConfig("literary-screenplay");
  const screenplay = getWritingTypeConfig("screenplay");

  assert.equal(literary.editorTitle, "文学剧本写作台");
  assert.equal(screenplay.editorTitle, "剧本写作台");
  assert.deepEqual(literary.primaryTools, ["场次", "段落", "人物", "旁白"]);
  assert.deepEqual(screenplay.primaryTools, ["Scene", "Action", "Character", "Dialogue", "Paren"]);
});

test("writingType config exposes AI focus labels used by the app shell", () => {
  const literary = getWritingTypeConfig("literary-screenplay");
  const screenplay = getWritingTypeConfig("screenplay");

  assert.equal(literary.aiFocus.includes("文学表达"), true);
  assert.equal(screenplay.aiFocus.includes("对白行动"), true);
});

test("writing workbench defaults switch task, templates and workflows by writingType", () => {
  const literary = getWritingWorkbenchDefaults("literary-screenplay");
  const screenplay = getWritingWorkbenchDefaults("screenplay");

  assert.equal(literary.selectedWorkflowId, "novel-adaptation-film");
  assert.equal(screenplay.selectedWorkflowId, "short-drama-mystery");
  assert.equal(literary.selectedTemplateIds.includes("structuralist-screenwriting"), true);
  assert.equal(literary.selectedTemplateIds.includes("film-perusal-method"), true);
  assert.equal(screenplay.selectedTemplateIds.includes("scene-function"), true);
  assert.match(literary.aiTask, /文学剧本/);
  assert.match(screenplay.aiTask, /剧本医生/);
});

test("project library stores, lists, selects and deletes local projects", () => {
  const first = createProject({ id: "p1", title: "第一稿", fountain: "INT. 房间 - NIGHT\n甲\n你好。" });
  const second = createProject({ id: "p2", title: "第二稿", fountain: "EXT. 天台 - DAY\n乙\n走吧。" });
  const library = createProjectLibrary({ projects: [first] });
  const saved = createProjectLibrary(library).save(second);
  const selected = createProjectLibrary(saved).select("p2");
  const deleted = createProjectLibrary(selected.library).delete("p2");

  assert.equal(saved.projects.length, 2);
  assert.equal(saved.projects[0].id, "p2");
  assert.equal(selected.project.title, "第二稿");
  assert.equal(deleted.activeProjectId, "p1");
  assert.equal(deleted.projects.length, 1);
});

test("project library can round-trip as a portable json bundle", () => {
  const first = createProject({ id: "p1", title: "第一稿", fountain: "Title: 第一稿" });
  const second = createProject({
    id: "p2",
    title: "第二稿",
    fountain: "Title: 第二稿",
    doctorActions: [{ id: "a1", text: "改场次", done: true }],
  });
  const library = createProjectLibrary({ activeProjectId: "p2", projects: [first, second] });
  const restored = importProjectLibrary(serializeProjectLibrary(library));

  assert.equal(restored.schema, "personal-screenwriter.library.v1");
  assert.equal(restored.activeProjectId, "p2");
  assert.deepEqual(restored.projects.map((project) => project.id).sort(), ["p1", "p2"]);
  assert.equal(restored.select("p2").project.doctorActions[0].done, true);
});

test("script doctor report turns project data into actionable diagnosis", () => {
  const project = createProject({
    title: "诊断稿",
    fountain: `INT. 档案室 - NIGHT
侦探
线索被藏在对白里。
EXT. 天台 - DAWN
导演
我们必须让选择付出代价。`,
    bible: {
      characters: [{ name: "侦探", goal: "找出真相" }],
      locations: [{ name: "档案室", notes: "线索集中地" }],
    },
  });
  const report = generateScriptDoctorReport(project);

  assert.equal(report.title, "诊断稿");
  assert.equal(report.metrics.sceneCount, 2);
  assert.match(report.summary, /2 场/);
  assert.equal(report.findings.length >= 3, true);
  assert.equal(report.nextActions.length >= 3, true);
  assert.equal(report.actions.length >= 3, true);
  assert.equal(report.actions[0].done, false);
  assert.match(report.actions[0].prompt, /请处理这个剧本诊断任务/);
  assert.match(report.markdown, /Script Doctor/);
  assert.match(report.markdown, /下一步/);
});

test("rewrite draft turns a doctor action into a scene-level prompt", () => {
  const project = createProject({
    title: "改写稿",
    fountain: `Title: 改写稿

INT. 档案室 - NIGHT

侦探
钥匙在哪里？

助手
门后面。`,
    bible: {
      characters: [{ name: "侦探", goal: "找到出口" }],
      props: [{ name: "钥匙", notes: "关键道具" }],
    },
  });
  const report = generateScriptDoctorReport(project);
  const draft = generateRewriteDraft(project, report.actions[0]);

  assert.equal(draft.title.includes("改写稿"), true);
  assert.equal(draft.scene.heading, "INT. 档案室 - NIGHT");
  assert.equal(draft.characters.includes("侦探"), true);
  assert.equal(draft.assets.includes("钥匙"), true);
  assert.match(draft.prompt, /请改写/);
  assert.match(draft.prompt, /钥匙在哪里/);
});

test("delivery packet bundles diagnosis rewrite relations and script", () => {
  const project = createProject({
    title: "交付稿",
    fountain: `Title: 交付稿

INT. 档案室 - NIGHT

侦探
钥匙在哪里？`,
    bible: { props: [{ name: "钥匙", notes: "关键道具" }] },
  });
  const packet = buildDeliveryPacket(project);

  assert.equal(packet.filename, "交付稿-delivery.md");
  assert.match(packet.markdown, /# 交付稿 · Delivery Packet/);
  assert.match(packet.markdown, /## Script Doctor/);
  assert.match(packet.markdown, /## Rewrite Draft/);
  assert.match(packet.markdown, /## Relationship Board/);
  assert.match(packet.markdown, /钥匙在哪里/);
});

test("text quality report summarizes scene function arcs dialogue and priorities", () => {
  const project = createProject({
    title: "质检稿",
    fountain: `Title: 质检稿

INT. 档案室 - NIGHT

侦探
钥匙在哪里？`,
    bible: { characters: [{ name: "侦探", goal: "找到出口" }] },
  });
  const report = buildTextQualityReport(project);

  assert.equal(report.title, "质检稿 · Text Quality Report");
  assert.equal(report.sceneFunctions[0].heading, "INT. 档案室 - NIGHT");
  assert.equal(report.characterArcs.some((item) => item.name === "侦探"), true);
  assert.equal(report.dialogueIssues.length > 0, true);
  assert.equal(report.rewritePriorities.length >= 3, true);
  assert.match(report.markdown, /## 场景功能表/);
  assert.match(report.markdown, /## 对白问题清单/);
});

test("visual development pack turns script objects into production prompts", () => {
  const project = createProject({
    title: "视觉稿",
    fountain: `Title: 视觉稿

INT. 档案室 - NIGHT

侦探
钥匙在哪里？`,
    bible: {
      characters: [{ name: "侦探", role: "主角", goal: "找到出口" }],
      props: [{ name: "钥匙", notes: "关键道具" }],
      locations: [{ name: "档案室", notes: "昏暗、拥挤" }],
    },
  });
  const pack = buildVisualDevelopmentPack(project);

  assert.equal(pack.title, "视觉稿 · Visual Development Pack");
  assert.equal(pack.assets.some((asset) => asset.type === "Character Portrait" && asset.name === "侦探"), true);
  assert.equal(pack.assets.some((asset) => asset.type === "Scene Still" && asset.name.includes("档案室")), true);
  assert.equal(pack.assets.some((asset) => asset.type === "Prop Detail" && asset.name === "钥匙"), true);
  assert.match(pack.markdown, /Storyboard Frame/);
  assert.match(pack.markdown, /cinematic visual reference/);
});

test("doctor actions persist on projects and can be checked off", () => {
  const project = createProject({
    title: "行动稿",
    doctorActions: [{ id: "a1", text: "补人物代价", prompt: "请补人物代价", done: false }],
  });
  const updated = updateDoctorAction(project, "a1", { done: true });

  assert.equal(project.doctorActions.length, 1);
  assert.equal(updated.doctorActions[0].done, true);
  assert.equal(updated.doctorActions[0].text, "补人物代价");
});

test("project catalog exposes Laper-style object groups and richer script data", () => {
  const project = createProject({
    title: "对象稿",
    fountain: `INT. 档案室 - NIGHT
侦探
线索被藏在钥匙里。
EXT. 天台 - DAWN
导演
钥匙打开了门。`,
    bible: {
      characters: [{ name: "侦探", role: "主角" }],
      props: [{ name: "钥匙", notes: "关键道具" }],
      locations: [{ name: "天台", notes: "结尾地点" }],
    },
    assets: [{ label: "参考图", path: "assets/ref.png", family: "Assets", category: "image" }],
    shotPlan: { shots: [{ id: "s1", shotNumber: 1, shotSize: "MS" }] },
  });
  const catalog = buildProjectCatalog(project);
  const summary = summarizeProject(project);

  assert.equal(catalog.Scenes.length, 2);
  assert.equal(catalog.Characters.some((item) => item.name === "侦探"), true);
  assert.equal(catalog.Props.some((item) => item.name === "钥匙"), true);
  assert.equal(catalog.Locations.some((item) => item.name === "天台"), true);
  assert.equal(catalog.Assets.length, 1);
  assert.equal(summary.beatCount, 4);
  assert.equal(summary.frameCount, 1);
  assert.equal(summary.relationCount >= 2, true);
});

test("breakdown board links scenes, objects and relationship wall data", () => {
  const project = createProject({
    title: "关系稿",
    fountain: `Title: 关系稿

INT. 档案室 - NIGHT

侦探
钥匙在哪里？

助手
门后面。

EXT. 天台 - DAWN

侦探
我们找到出口了。`,
    bible: {
      props: [{ name: "钥匙", notes: "打开门" }],
      locations: [{ name: "天台", notes: "结尾地点" }],
    },
  });

  const board = buildBreakdownBoard(project);

  assert.equal(board.scenes.length, 2);
  assert.equal(board.scenes[0].characters.includes("侦探"), true);
  assert.equal(board.catalog.Props.some((item) => item.name === "钥匙"), true);
  assert.equal(board.relationships.nodes.some((node) => node.type === "character"), true);
  assert.equal(board.relationships.edges.some((edge) => edge.source === "character:侦探"), true);
});

test("literary-screenplay config exposes adaptation workbench signals", () => {
  const literary = getWritingTypeConfig("literary-screenplay");
  const defaults = getWritingWorkbenchDefaults("literary-screenplay");

  assert.equal(literary.aiFocus.includes("改编母本"), true);
  assert.equal(defaults.selectedWorkflowId, "novel-adaptation-film");
  assert.equal(defaults.selectedTemplateIds.includes("structuralist-screenwriting"), true);
  assert.equal(defaults.selectedTemplateIds.includes("film-perusal-method"), true);
  assert.equal(defaults.selectedTemplateIds.includes("verbal-action-dialogue"), true);
});
