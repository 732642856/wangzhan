import assert from "node:assert/strict";
import test from "node:test";

import { getSchema } from "@tiptap/core";

import { createPersonalScreenwriterExtensions } from "../src/opendraft/createExtensions.js";
import { __testHelpers } from "../src/opendraft/mountHost.js";
import { extractSceneNavigation } from "../src/opendraft/navigation.js";
import { normalizeScreenplayDocStructure } from "../src/opendraft/format.js";

test("defines the OpenDraft extension set needed by the writing-core host", () => {
  const extensions = createPersonalScreenwriterExtensions();
  const names = extensions.map((extension) => extension.name);

  for (const name of [
    "sceneHeading",
    "action",
    "character",
    "dialogue",
    "parenthetical",
    "transition",
    "shot",
    "titlePage",
    "newAct",
    "endOfAct",
    "scriptNote",
    "productionTag",
  ]) {
    assert.equal(names.includes(name), true, `missing extension ${name}`);
  }
});
test("resolves note and tag scene field targets for adaptation workbench jump-back", () => {
  const { resolveSceneFieldTargetFromNote, resolveSceneFieldTargetFromTag } = __testHelpers();

  assert.deepEqual(resolveSceneFieldTargetFromNote({
    id: "note-1",
    sceneId: "scene-1",
    elementType: "sceneHeading",
  }), {
    sceneId: "scene-1",
    field: "adaptationFunction",
  });

  assert.deepEqual(resolveSceneFieldTargetFromTag({
    id: "tag-1",
    sceneId: "scene-2",
    categoryId: "writing",
  }), {
    sceneId: "scene-2",
    field: "turnType",
  });

  assert.deepEqual(resolveSceneFieldTargetFromTag({
    id: "tag-2",
    sceneId: "scene-3",
    categoryId: "character",
  }), {
    sceneId: "scene-3",
    field: "adaptationFunction",
  });

  assert.deepEqual(resolveSceneFieldTargetFromTag({
    id: "tag-3",
    sceneId: "scene-4",
    categoryId: "structure",
  }), {
    sceneId: "scene-4",
    field: "conflictGoal",
  });

  assert.deepEqual(resolveSceneFieldTargetFromTag({
    id: "tag-4",
    sceneId: "scene-5",
    categoryId: "emotion",
  }), {
    sceneId: "scene-5",
    field: "exitChange",
  });

  assert.deepEqual(resolveSceneFieldTargetFromTag({
    id: "tag-5",
    sceneId: "scene-6",
    categoryId: "relationship",
  }), {
    sceneId: "scene-6",
    field: "sourceReference",
  });

  assert.deepEqual(resolveSceneFieldTargetFromTag({
    id: "tag-6",
    sceneId: "scene-7",
    categoryId: "world",
  }), {
    sceneId: "scene-7",
    field: "conflictGoal",
  });

  assert.deepEqual(resolveSceneFieldTargetFromTag({
    id: "tag-7",
    sceneId: "scene-8",
    categoryId: "emotion",
  }, {
    emotion: "sourceReference",
  }), {
    sceneId: "scene-8",
    field: "sourceReference",
  });

  assert.equal(resolveSceneFieldTargetFromNote({ id: "note-x", sceneId: "", elementType: "action" }), null);
  assert.equal(resolveSceneFieldTargetFromTag({ id: "tag-x", sceneId: "" }), null);
});

test("goes to adaptation field by scene id using existing scene entries", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { goToAdaptationField } = __testHelpers();
  const calls = [];
  const chainApi = {
    focus(pos) {
      calls.push(["focus", pos]);
      return chainApi;
    },
    run() {
      calls.push(["run"]);
      return true;
    },
  };
  const editor = {
    state: {
      doc: schema.nodeFromJSON({
        type: "doc",
        content: [
          { type: "newAct", attrs: { actNumber: 1 }, content: [{ type: "text", text: "ACT ONE" }] },
          { type: "sceneHeading", attrs: { id: "scene-1" }, content: [{ type: "text", text: "INT. 档案室 - NIGHT" }] },
        ],
      }),
    },
    chain() {
      return chainApi;
    },
  };
  const screenState = { activeSceneId: null };

  assert.equal(goToAdaptationField(editor, screenState, "scene-1", "turnType"), true);
  assert.equal(screenState.activeSceneId, "scene-1");
  assert.equal(calls.some((item) => item[0] === "focus"), true);
  assert.equal(goToAdaptationField(editor, screenState, "scene-x", "turnType"), false);
});

test("counts scene-linked notes and tags for adaptation workbench", () => {
  const { countSceneLinkedItems } = __testHelpers();

  assert.deepEqual(countSceneLinkedItems({
    sceneId: "scene-1",
    scriptNotes: [
      { id: "note-1", sceneId: "scene-1" },
      { id: "note-2", sceneId: "scene-1" },
      { id: "note-3", sceneId: "scene-2" },
    ],
    tags: [
      { id: "tag-1", sceneId: "scene-1" },
      { id: "tag-2", sceneId: "scene-3" },
    ],
  }), {
    notes: 2,
    tags: 1,
  });

  assert.deepEqual(countSceneLinkedItems({
    sceneId: "scene-x",
    scriptNotes: [],
    tags: [],
  }), {
    notes: 0,
    tags: 0,
  });
});

test("finds first scene-linked note and tag ids for reverse jump", () => {
  const { findFirstSceneLinkedItemId } = __testHelpers();

  assert.equal(findFirstSceneLinkedItemId([
    { id: "note-1", sceneId: "scene-2" },
    { id: "note-2", sceneId: "scene-1" },
    { id: "note-3", sceneId: "scene-1" },
  ], "scene-1"), "note-2");

  assert.equal(findFirstSceneLinkedItemId([
    { id: "tag-1", sceneId: "scene-3" },
  ], "scene-1"), null);
});

test("filters items by current scene when scene filter is active", () => {
  const { filterItemsByScene } = __testHelpers();

  assert.deepEqual(filterItemsByScene([
    { id: "note-1", sceneId: "scene-1" },
    { id: "note-2", sceneId: "scene-2" },
    { id: "note-3", sceneId: "scene-1" },
  ], "scene-1", true).map((item) => item.id), ["note-1", "note-3"]);

  assert.deepEqual(filterItemsByScene([
    { id: "tag-1", sceneId: "scene-1" },
    { id: "tag-2", sceneId: "scene-2" },
  ], "scene-1", false).map((item) => item.id), ["tag-1", "tag-2"]);
});

test("extracts scene navigation entries from screenplayDoc", () => {
  const navigation = extractSceneNavigation({
    type: "doc",
    content: [
      {
        type: "sceneHeading",
        attrs: { id: "scene-1", adaptationFunction: "开场建压", sourceReference: "原著第一章", turnType: "信息落差", conflictGoal: "逼供", exitChange: "获得钥匙" },
        content: [{ type: "text", text: "INT. 档案室 - NIGHT" }],
      },
      { type: "action", content: [{ type: "text", text: "灯亮着。" }] },
      { type: "sceneHeading", attrs: { id: "scene-2" }, content: [{ type: "text", text: "EXT. 江边 - DAWN" }] },
    ],
  });

  assert.deepEqual(navigation, [
    { id: "scene-1", title: "INT. 档案室 - NIGHT", index: 1, actLabel: "", synopsis: "", location: "档案室", time: "NIGHT", adaptationFunction: "开场建压", sourceReference: "原著第一章", turnType: "信息落差", conflictGoal: "逼供", exitChange: "获得钥匙" },
    { id: "scene-2", title: "EXT. 江边 - DAWN", index: 2, actLabel: "", synopsis: "", location: "江边", time: "DAWN", adaptationFunction: "", sourceReference: "", turnType: "", conflictGoal: "", exitChange: "" },
  ]);
});

test("extracts act labels and synopsis from screenplayDoc navigation", () => {
  const navigation = extractSceneNavigation({
    type: "doc",
    content: [
      { type: "newAct", attrs: { actNumber: 1, actName: "ACT ONE" }, content: [{ type: "text", text: "ACT ONE" }] },
      { type: "sceneHeading", attrs: { id: "scene-1", synopsis: "有人撒谎" }, content: [{ type: "text", text: "INT. 审讯室 - NIGHT" }] },
      { type: "endOfAct", attrs: { actNumber: 1, actName: "END OF ACT ONE" }, content: [{ type: "text", text: "END OF ACT ONE" }] },
      { type: "newAct", attrs: { actNumber: 2, actName: "ACT TWO" }, content: [{ type: "text", text: "ACT TWO" }] },
      { type: "sceneHeading", attrs: { id: "scene-2" }, content: [{ type: "text", text: "EXT. 江边 - DAWN" }] },
    ],
  });

  assert.deepEqual(navigation, [
    { id: "scene-1", title: "INT. 审讯室 - NIGHT", index: 1, actLabel: "A1", synopsis: "有人撒谎", location: "审讯室", time: "NIGHT", adaptationFunction: "", sourceReference: "", turnType: "", conflictGoal: "", exitChange: "" },
    { id: "scene-2", title: "EXT. 江边 - DAWN", index: 2, actLabel: "A2", synopsis: "", location: "江边", time: "DAWN", adaptationFunction: "", sourceReference: "", turnType: "", conflictGoal: "", exitChange: "" },
  ]);
});

test("normalizes screenplay doc structure for acts and scene ids", () => {
  const normalized = normalizeScreenplayDocStructure({
    type: "doc",
    content: [
      { type: "newAct", attrs: { actNumber: 4, actName: "ACT 4", customName: "" }, content: [{ type: "text", text: "ACT 4" }] },
      { type: "sceneHeading", attrs: {}, content: [{ type: "text", text: "INT. 房间 - NIGHT" }] },
      { type: "endOfAct", attrs: { actNumber: 99, actName: "END OF ACT 99" }, content: [{ type: "text", text: "END OF ACT 99" }] },
      { type: "newAct", attrs: { actNumber: 9, actName: "ACT 9", customName: "" }, content: [{ type: "text", text: "ACT 9" }] },
      { type: "sceneHeading", attrs: { id: "scene-x" }, content: [{ type: "text", text: "EXT. 江边 - DAWN" }] },
    ],
  });

  const acts = normalized.content.filter((node) => node.type === "newAct");
  const endActs = normalized.content.filter((node) => node.type === "endOfAct");
  const scenes = normalized.content.filter((node) => node.type === "sceneHeading");

  assert.equal(acts[0].attrs.actNumber, 1);
  assert.equal(acts[1].attrs.actNumber, 2);
  assert.equal(endActs[0].attrs.actNumber, 1);
  assert.equal(scenes[0].attrs.id, "scene-1");
  assert.equal(scenes[1].attrs.id, "scene-x");
});

test("detects existing note mark from a collapsed selection", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { findMarkIdInDocSelection } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "action",
        content: [
          {
            type: "text",
            text: "hello world",
            marks: [{ type: "scriptNote", attrs: { noteId: "note-1", color: "#f4d35e" } }],
          },
        ],
      },
    ],
  });

  const foundId = findMarkIdInDocSelection(doc, schema.marks.scriptNote, "noteId", 3, 3, true);
  assert.equal(foundId, "note-1");
});

test("finds first occurrence for note and tag jumps", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { findMarkOccurrenceInDoc } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "action",
        content: [
          {
            type: "text",
            text: "clue",
            marks: [{ type: "scriptNote", attrs: { noteId: "note-2", color: "#f4d35e" } }],
          },
          { type: "text", text: " and " },
          {
            type: "text",
            text: "prop",
            marks: [{ type: "productionTag", attrs: { tagId: "tag-2", categoryId: "writing", color: "#2f6f6d" } }],
          },
        ],
      },
    ],
  });

  const noteOccurrence = findMarkOccurrenceInDoc(doc, schema.marks.scriptNote, "noteId", "note-2");
  const tagOccurrence = findMarkOccurrenceInDoc(doc, schema.marks.productionTag, "tagId", "tag-2");

  assert.deepEqual(noteOccurrence, {
    from: 1,
    to: 5,
    text: "clue",
    attrs: { noteId: "note-2", color: "#f4d35e" },
  });
  assert.deepEqual(tagOccurrence, {
    from: 10,
    to: 14,
    text: "prop",
    attrs: { tagId: "tag-2", categoryId: "writing", color: "#2f6f6d" },
  });
});

test("collects ranges for deleting all note or tag highlights", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { collectMarkRanges } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "action",
        content: [
          {
            type: "text",
            text: "alpha",
            marks: [{ type: "scriptNote", attrs: { noteId: "note-3", color: "#f4d35e" } }],
          },
          { type: "text", text: " " },
          {
            type: "text",
            text: "beta",
            marks: [{ type: "scriptNote", attrs: { noteId: "note-3", color: "#f4d35e" } }],
          },
          { type: "text", text: " " },
          {
            type: "text",
            text: "wardrobe",
            marks: [{ type: "productionTag", attrs: { tagId: "tag-3", categoryId: "writing", color: "#2f6f6d" } }],
          },
        ],
      },
    ],
  });

  const noteRanges = collectMarkRanges(doc, schema.marks.scriptNote, "noteId", "note-3");
  const tagRanges = collectMarkRanges(doc, schema.marks.productionTag, "tagId", "tag-3");

  assert.deepEqual(noteRanges, [
    { from: 1, to: 6, attrs: { noteId: "note-3", color: "#f4d35e" } },
    { from: 7, to: 11, attrs: { noteId: "note-3", color: "#f4d35e" } },
  ]);
  assert.deepEqual(tagRanges, [
    { from: 12, to: 20, attrs: { tagId: "tag-3", categoryId: "writing", color: "#2f6f6d" } },
  ]);
});

test("removes note and tag records from screen state", () => {
  const { deleteScreenNote, deleteTag } = __testHelpers();
  const screenState = {
    scriptNotes: [
      { id: "note-a", content: "x" },
      { id: "note-b", content: "y" },
    ],
    tags: [
      { id: "tag-a", name: "A" },
      { id: "tag-b", name: "B" },
    ],
    activeNoteId: "note-b",
    activeTagId: "tag-a",
  };

  deleteScreenNote(screenState, "note-b");
  deleteTag(screenState, "tag-a");

  assert.deepEqual(screenState.scriptNotes, [{ id: "note-a", content: "x" }]);
  assert.deepEqual(screenState.tags, [{ id: "tag-b", name: "B" }]);
  assert.equal(screenState.activeNoteId, null);
  assert.equal(screenState.activeTagId, null);
});

test("counts mark occurrences for zero-hit note or tag records", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { countMarkOccurrences } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "action",
        content: [{ type: "text", text: "alpha" }],
      },
    ],
  });

  assert.equal(countMarkOccurrences(doc, schema.marks.scriptNote, "noteId", "note-x"), 0);
  assert.equal(countMarkOccurrences(doc, schema.marks.productionTag, "tagId", "tag-x"), 0);
});

test("filters tags by selected category", () => {
  const { filterTagsByCategory } = __testHelpers();
  const tags = [
    { id: "t1", categoryId: "writing" },
    { id: "t2", categoryId: "character" },
  ];

  assert.deepEqual(filterTagsByCategory(tags, "all").map((tag) => tag.id), ["t1", "t2"]);
  assert.deepEqual(filterTagsByCategory(tags, "character").map((tag) => tag.id), ["t2"]);
});

test("updates tag category in screen state", () => {
  const { setTagCategory } = __testHelpers();
  const screenState = {
    tags: [{ id: "t1", categoryId: "writing", updatedAt: "" }],
  };

  setTagCategory(screenState, "t1", "plot");

  assert.equal(screenState.tags[0].categoryId, "plot");
});

test("removes only the current note hit and preserves other occurrences", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { countMarkOccurrences, findMarkOccurrenceInDoc, removeMarkRangeFromDoc } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "action",
        content: [
          {
            type: "text",
            text: "alpha",
            marks: [{ type: "scriptNote", attrs: { noteId: "note-y", color: "#f4d35e" } }],
          },
          { type: "text", text: " " },
          {
            type: "text",
            text: "beta",
            marks: [{ type: "scriptNote", attrs: { noteId: "note-y", color: "#f4d35e" } }],
          },
        ],
      },
    ],
  });

  const nextDoc = removeMarkRangeFromDoc(doc, schema.marks.scriptNote, {
    from: 1,
    to: 6,
    attrs: { noteId: "note-y", color: "#f4d35e" },
  });

  assert.equal(countMarkOccurrences(nextDoc, schema.marks.scriptNote, "noteId", "note-y"), 1);
  assert.deepEqual(findMarkOccurrenceInDoc(nextDoc, schema.marks.scriptNote, "noteId", "note-y"), {
    from: 7,
    to: 11,
    text: "beta",
    attrs: { noteId: "note-y", color: "#f4d35e" },
  });
});

test("title page helper preserves extended adaptation metadata fields", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { getTitlePageAttrsFromDoc } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "titlePage",
        attrs: {
          field: "title",
          tpTitle: "雾港",
          tpWrittenBy: "编剧甲",
          tpBasedOn: "改编自同名小说",
          tpDraft: "第二稿",
          tpDraftDate: "2026-07-03",
          tpContact: "agent@example.com",
          tpCopyright: "All Rights Reserved",
          tpWgaRegistration: "WGA-001",
          tpNotes: "电影改编台样稿",
          tpTitleFontSize: 12,
        },
        content: [{ type: "text", text: "雾港" }],
      },
    ],
  });

  assert.deepEqual(getTitlePageAttrsFromDoc(doc), {
    tpTitle: "雾港",
    tpWrittenBy: "编剧甲",
    tpBasedOn: "改编自同名小说",
    tpDraft: "第二稿",
    tpDraftDate: "2026-07-03",
    tpContact: "agent@example.com",
    tpCopyright: "All Rights Reserved",
    tpWgaRegistration: "WGA-001",
    tpNotes: "电影改编台样稿",
  });
});

test("finds next occurrence after current range for repeated tag or note hits", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { findNextMarkOccurrenceInDoc } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "action",
        content: [
          {
            type: "text",
            text: "alpha",
            marks: [{ type: "productionTag", attrs: { tagId: "tag-x", categoryId: "writing" } }],
          },
          { type: "text", text: " " },
          {
            type: "text",
            text: "beta",
            marks: [{ type: "productionTag", attrs: { tagId: "tag-x", categoryId: "writing" } }],
          },
        ],
      },
    ],
  });

  const first = findNextMarkOccurrenceInDoc(doc, schema.marks.productionTag, "tagId", "tag-x");
  const second = findNextMarkOccurrenceInDoc(doc, schema.marks.productionTag, "tagId", "tag-x", first);

  assert.equal(first?.text, "alpha");
  assert.equal(second?.text, "beta");
});

test("updates adaptation attrs for a scene heading by scene id", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { getSceneContextFromDoc, updateSceneAttrsInDoc } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "sceneHeading",
        attrs: { id: "scene-1" },
        content: [{ type: "text", text: "INT. 档案室 - NIGHT" }],
      },
    ],
  });

  const nextDoc = updateSceneAttrsInDoc(doc, "scene-1", {
    adaptationFunction: "建立母题",
    sourceReference: "原著第 3 章",
    turnType: "关系逆转",
    conflictGoal: "迫使坦白",
    exitChange: "关系破裂",
  });

  assert.deepEqual(getSceneContextFromDoc(nextDoc, "scene-1"), {
    id: "scene-1",
    title: "INT. 档案室 - NIGHT",
    adaptationFunction: "建立母题",
    sourceReference: "原著第 3 章",
    turnType: "关系逆转",
    conflictGoal: "迫使坦白",
    exitChange: "关系破裂",
  });
});

test("creates current-scene shortcut note and tag from active scene context", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { createSceneShortcutNote, createSceneShortcutTag } = __testHelpers();
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "sceneHeading",
        attrs: {
          id: "scene-1",
          adaptationFunction: "建立母题",
          sourceReference: "原著第 3 章",
          turnType: "关系逆转",
          conflictGoal: "迫使坦白",
          exitChange: "关系破裂",
        },
        content: [{ type: "text", text: "INT. 档案室 - NIGHT" }],
      },
    ],
  });
  const editor = {
    state: {
      doc,
      selection: { from: 1 },
    },
  };
  const screenState = {
    activeSceneId: "scene-1",
    scriptNotes: [],
    tags: [],
    activeNoteId: null,
    activeTagId: null,
  };

  const noteId = createSceneShortcutNote(editor, screenState);
  const tagId = createSceneShortcutTag(editor, screenState);

  assert.equal(Boolean(noteId), true);
  assert.equal(Boolean(tagId), true);
  assert.match(screenState.scriptNotes[0].content, /建立母题/);
  assert.match(screenState.scriptNotes[0].content, /原著第 3 章/);
  assert.match(screenState.scriptNotes[0].content, /迫使坦白/);
  assert.match(screenState.scriptNotes[0].content, /关系破裂/);
  assert.equal(screenState.tags[0].name, "关系逆转");
  assert.match(screenState.tags[0].notes, /原著第 3 章/);
  assert.match(screenState.tags[0].notes, /迫使坦白/);
  assert.match(screenState.tags[0].notes, /关系破裂/);
});

test("scene shortcut helpers mount real heading highlights when editor chain is available", () => {
  const schema = getSchema(createPersonalScreenwriterExtensions());
  const { createSceneShortcutNote, createSceneShortcutTag } = __testHelpers();
  const calls = [];
  const chainApi = {
    focus(pos) {
      calls.push(["focus", pos]);
      return chainApi;
    },
    setTextSelection(range) {
      calls.push(["setTextSelection", range]);
      return chainApi;
    },
    setMark(name, attrs) {
      calls.push(["setMark", name, attrs]);
      return chainApi;
    },
    run() {
      calls.push(["run"]);
      return true;
    },
  };
  const editor = {
    state: {
      doc: schema.nodeFromJSON({
        type: "doc",
        content: [
          {
            type: "sceneHeading",
            attrs: { id: "scene-1" },
            content: [{ type: "text", text: "INT. 档案室 - NIGHT" }],
          },
        ],
      }),
      selection: { from: 1 },
    },
    chain() {
      return chainApi;
    },
  };
  const screenState = {
    activeSceneId: "scene-1",
    scriptNotes: [],
    tags: [],
    activeNoteId: null,
    activeTagId: null,
  };

  createSceneShortcutNote(editor, screenState);
  createSceneShortcutTag(editor, screenState);

  assert.equal(calls.some((item) => item[0] === "setMark" && item[1] === "scriptNote"), true);
  assert.equal(calls.some((item) => item[0] === "setMark" && item[1] === "productionTag"), true);
});
