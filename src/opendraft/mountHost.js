import { Editor } from "@tiptap/core";
import { Transform } from "@tiptap/pm/transform";

import { createPersonalScreenwriterExtensions } from "./createExtensions.js";
import { createScreenplayDocFromFountain, exportScreenplayDocToFountain, normalizeScreenplayDocStructure } from "./format.js";
import { extractSceneNavigation } from "./navigation.js";

const PRIMARY_TOOLS = [
  { action: "sceneHeading", label: "Scene" },
  { action: "action", label: "Action" },
  { action: "character", label: "Character" },
  { action: "dialogue", label: "Dialogue" },
  { action: "parenthetical", label: "Paren" },
  { action: "transition", label: "Transition" },
  { action: "shot", label: "Shot" },
  { action: "scriptNote", label: "Note" },
  { action: "productionTag", label: "Tag" },
];

const SECONDARY_TOOLS = [
  { action: "insertTitlePage", label: "Title" },
  { action: "insertNewAct", label: "Act +" },
  { action: "insertEndOfAct", label: "Act -" },
];

const TAG_FIELD_OPTIONS = [
  { value: "turnType", label: "转折类型" },
  { value: "adaptationFunction", label: "场次功能" },
  { value: "conflictGoal", label: "冲突目标" },
  { value: "exitChange", label: "离场变化" },
  { value: "sourceReference", label: "母本对应" },
];

const DEFAULT_TAG_FIELD_MAPPINGS = {
  writing: "turnType",
  character: "adaptationFunction",
  structure: "conflictGoal",
  emotion: "exitChange",
  relationship: "sourceReference",
  world: "conflictGoal",
};

function getPrimaryTools(writingType = "screenplay") {
  if (writingType === "literary-screenplay") {
    return [
      { action: "sceneHeading", label: "场次" },
      { action: "action", label: "段落" },
      { action: "character", label: "人物" },
      { action: "dialogue", label: "旁白" },
      { action: "scriptNote", label: "Note" },
      { action: "productionTag", label: "Tag" },
    ];
  }

  return PRIMARY_TOOLS;
}

function getSecondaryTools(writingType = "screenplay") {
  if (writingType === "literary-screenplay") {
    return [
      { action: "insertTitlePage", label: "Title" },
      { action: "insertNewAct", label: "Act +" },
    ];
  }

  return SECONDARY_TOOLS;
}

export function mountScreenplayEditorHost(root, options = {}) {
  let isSyncing = false;
  let lastSerialized = "";
  let activePanel = "title";
  let screenState = createInitialScreenState(options);
  let activeWritingType = options.writingType || "screenplay";
  const primaryTools = getPrimaryTools(activeWritingType);
  const secondaryTools = getSecondaryTools(activeWritingType);

  root.innerHTML = `
    <div class="screenplay-workbench">
      <div class="screenplay-tools">
        <div class="screenplay-toolbar">
          ${primaryTools.map((tool) => `<button class="screenplay-tool" data-action="${tool.action}">${tool.label}</button>`).join("")}
        </div>
        <div class="screenplay-toolbar secondary">
          ${secondaryTools.map((tool) => `<button class="screenplay-tool subtle" data-action="${tool.action}">${tool.label}</button>`).join("")}
        </div>
        <div class="screenplay-inspector-tabs">
          ${["title", "acts", "notes", "tags"].map((panel) => `<button class="screenplay-inspector-tab${panel === activePanel ? " active" : ""}" data-panel="${panel}">${panelLabel(panel)}</button>`).join("")}
        </div>
      </div>
      <div class="screenplay-layout">
        <aside class="screenplay-nav">
          <div class="panel-title">Scene Navigator</div>
          <div class="scene-nav-jump">
            <button class="screenplay-tool subtle" data-action="jumpPrevScene">Prev</button>
            <button class="screenplay-tool subtle" data-action="jumpNextScene">Next</button>
          </div>
          <div class="scene-nav-list"></div>
        </aside>
        <div class="screenplay-stage">
          <div class="screenplay-inspector"></div>
          <div class="screenplay-editor"></div>
        </div>
      </div>
    </div>
  `;

  const editorElement = root.querySelector(".screenplay-editor");
  const navList = root.querySelector(".scene-nav-list");
  const inspector = root.querySelector(".screenplay-inspector");
  const initialDoc = normalizeScreenplayDoc(options.screenplayDoc);

  const editor = new Editor({
    element: editorElement,
    extensions: createPersonalScreenwriterExtensions(),
    content: initialDoc,
    editorProps: {
      attributes: {
        class: "screenplay-prosemirror",
        spellcheck: "false",
      },
    },
    onCreate() {
      syncScreenStateFromDoc(screenState, editor.getJSON());
      lastSerialized = serializeDoc(editor.getJSON());
      renderNavigator();
      renderInspector();
    },
    onSelectionUpdate() {
      syncActiveSceneFromSelection(editor, screenState);
      renderNavigator();
    },
    onUpdate() {
      if (isSyncing) return;
      const screenplayDoc = normalizeScreenplayDocStructure(editor.getJSON());
      if (serializeDoc(screenplayDoc) !== serializeDoc(editor.getJSON())) {
        isSyncing = true;
        editor.commands.setContent(screenplayDoc, false);
        isSyncing = false;
      }
      reconcileScreenStateWithMarks(editor, screenState);
      syncScreenStateFromDoc(screenState, screenplayDoc);
      lastSerialized = serializeDoc(screenplayDoc);
      renderNavigator();
      renderInspector();
      options.onChange?.({
        screenplayDoc,
        fountain: exportScreenplayDocToFountain(screenplayDoc),
        navigation: extractSceneNavigation(screenplayDoc),
        scriptNotes: screenState.scriptNotes,
        tagCategories: screenState.tagCategories,
        tagFieldMappings: screenState.tagFieldMappings,
        tags: screenState.tags,
      });
    },
  });

  for (const button of root.querySelectorAll(".screenplay-tool")) {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      applyToolbarAction(editor, action, screenState);
      if (action === "scriptNote") activePanel = "notes";
      if (action === "productionTag") activePanel = "tags";
      if (action === "insertTitlePage") activePanel = "title";
      if (action === "insertNewAct" || action === "insertEndOfAct") activePanel = "acts";
      root.querySelectorAll(".screenplay-inspector-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.panel === activePanel));
      renderNavigator();
      renderInspector();
    });
  }

  root.querySelectorAll(".screenplay-inspector-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activePanel = button.dataset.panel || "title";
      root.querySelectorAll(".screenplay-inspector-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      renderInspector();
    });
  });

  function renderNavigator() {
    const entries = getSceneEntries(editor);
    navList.innerHTML = entries.length
      ? entries
          .map(
            (entry) => `
              <button class="scene-nav-item${entry.id === screenState.activeSceneId ? " active" : ""}" data-scene-pos="${entry.pos}" data-scene-id="${escapeHtml(entry.id)}">
                <strong>${entry.index}. ${escapeHtml(entry.title || "未命名场景")}</strong>
                <small>${escapeHtml(entry.actLabel ? `${entry.actLabel} · ${entry.id}` : entry.id)}</small>
              </button>
            `,
          )
          .join("")
      : `<p class="empty">还没有场景标题。先切到 Scene 写第一场。</p>`;

    navList.querySelectorAll(".scene-nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        const pos = Number(button.dataset.scenePos || 0);
        screenState.activeSceneId = button.dataset.sceneId || null;
        editor.chain().focus(pos + 1).run();
        renderNavigator();
      });
    });
  }

  function renderInspector() {
    inspector.innerHTML = renderInspectorPanel(activePanel, editor, screenState);
    bindInspectorEvents();
  }

  function focusActiveSceneField(field) {
    const target = inspector.querySelector(`[data-scene-edit-id="${screenState.activeSceneId || ""}"] [data-scene-field="${field}"]`);
    if (!target) return false;
    target.focus();
    target.select?.();
    return true;
  }

  function bindInspectorEvents() {
    if (activePanel === "title") {
      inspector.querySelectorAll("[data-title-field]").forEach((input) => {
        const handler = () => {
          updateTitlePageField(editor, input.dataset.titleField, input.value);
          emitCurrentState();
        };
        input.addEventListener("change", handler);
        input.addEventListener("input", handler);
      });
    }

    if (activePanel === "acts") {
      inspector.querySelectorAll("[data-act-jump]").forEach((button) => {
        button.addEventListener("click", () => {
          const targetId = button.dataset.actJump;
          const targetEntry = getSceneEntries(editor).find((entry) => entry.id === targetId);
          if (!targetEntry) return;
          screenState.activeSceneId = targetEntry.id;
          editor.chain().focus(targetEntry.pos + 1).run();
          renderNavigator();
          renderInspector();
        });
      });
      inspector.querySelectorAll("[data-scene-field]").forEach((input) => {
        const handler = () => {
          const sceneId = input.closest("[data-scene-edit-id]")?.dataset.sceneEditId;
          if (!sceneId || !input.dataset.sceneField) return;
          editor.commands.setContent(updateSceneAttrsInDoc(editor.getJSON(), sceneId, {
            [input.dataset.sceneField]: input.value,
          }), false);
          emitCurrentState();
        };
        input.addEventListener("change", handler);
        input.addEventListener("input", handler);
      });
      inspector.querySelector("[data-scene-linked-notes]")?.addEventListener("click", () => {
        const noteId = inspector.querySelector("[data-scene-first-note-id]")?.value;
        if (!noteId) return;
        screenState.activeNoteSceneFilter = true;
        screenState.activeNoteId = noteId;
        activePanel = "notes";
        renderInspector();
      });
      inspector.querySelector("[data-scene-linked-tags]")?.addEventListener("click", () => {
        const tagId = inspector.querySelector("[data-scene-first-tag-id]")?.value;
        if (!tagId) return;
        screenState.activeTagSceneFilter = true;
        screenState.activeTagId = tagId;
        activePanel = "tags";
        renderInspector();
      });
      inspector.querySelector("[data-scene-shortcut-note]")?.addEventListener("click", () => {
        createSceneShortcutNote(editor, screenState);
        emitCurrentState();
        activePanel = "notes";
        renderInspector();
      });
      inspector.querySelector("[data-scene-shortcut-tag]")?.addEventListener("click", () => {
        createSceneShortcutTag(editor, screenState);
        emitCurrentState();
        activePanel = "tags";
        renderInspector();
      });
    }

    if (activePanel === "notes") {
      inspector.querySelector("[data-note-scene-filter]")?.addEventListener("click", () => {
        screenState.activeNoteSceneFilter = !screenState.activeNoteSceneFilter;
        renderInspector();
      });
      inspector.querySelectorAll("[data-note-scene-field]").forEach((button) => {
        button.addEventListener("click", () => {
          const sceneId = button.dataset.sceneId;
          const field = button.dataset.sceneFieldTarget;
          if (!goToAdaptationField(editor, screenState, sceneId, field)) return;
          activePanel = "acts";
          renderNavigator();
          renderInspector();
          focusActiveSceneField(field);
        });
      });
      inspector.querySelectorAll("[data-note-delete-hit]").forEach((button) => {
        button.addEventListener("click", () => {
          const noteId = button.dataset.noteDeleteHit;
          if (!noteId) return;
          const range = findMarkRangeAtSelection(editor, "scriptNote", "noteId", noteId);
          if (!range) return;
          removeMarkRange(editor, "scriptNote", range);
          emitCurrentState();
        });
      });
      inspector.querySelectorAll("[data-note-jump]").forEach((button) => {
        button.addEventListener("click", () => {
          const noteId = button.dataset.noteJump;
          if (!noteId) return;
          const occurrence = findMarkOccurrence(editor, "scriptNote", "noteId", noteId);
          if (!occurrence) return;
          screenState.activeNoteId = noteId;
          editor.chain().focus(occurrence.from).setTextSelection({ from: occurrence.from, to: occurrence.to }).run();
          renderNavigator();
          renderInspector();
        });
      });
      inspector.querySelectorAll("[data-note-jump-next]").forEach((button) => {
        button.addEventListener("click", () => {
          const noteId = button.dataset.noteJumpNext;
          if (!noteId) return;
          const current = findMarkRangeAtSelection(editor, "scriptNote", "noteId", noteId);
          const occurrence = findNextMarkOccurrenceInDoc(editor.state.doc, editor.state.schema.marks.scriptNote, "noteId", noteId, current);
          if (!occurrence) return;
          screenState.activeNoteId = noteId;
          editor.chain().focus(occurrence.from).setTextSelection({ from: occurrence.from, to: occurrence.to }).run();
          renderNavigator();
          renderInspector();
        });
      });
      inspector.querySelectorAll("[data-note-delete]").forEach((button) => {
        button.addEventListener("click", () => {
          const noteId = button.dataset.noteDelete;
          if (!noteId) return;
          removeMarksById(editor, "scriptNote", "noteId", noteId);
          deleteScreenNote(screenState, noteId);
          emitCurrentState();
        });
      });
      inspector.querySelectorAll("[data-note-id]").forEach((wrapper) => {
        const noteId = wrapper.dataset.noteId;
        const textarea = wrapper.querySelector("textarea");
        const colorInput = wrapper.querySelector('input[type="color"]');
        if (textarea && noteId) {
          textarea.addEventListener("change", () => {
            updateScreenNote(screenState, noteId, { content: textarea.value });
            emitCurrentState();
          });
        }
        if (colorInput && noteId) {
          colorInput.addEventListener("input", () => {
            updateScreenNote(screenState, noteId, { color: colorInput.value });
            syncMarksColor(editor, "scriptNote", "noteId", noteId, { noteId, color: colorInput.value });
            emitCurrentState();
          });
        }
      });
    }

    if (activePanel === "tags") {
      inspector.querySelector("[data-tag-scene-filter]")?.addEventListener("click", () => {
        screenState.activeTagSceneFilter = !screenState.activeTagSceneFilter;
        renderInspector();
      });
      inspector.querySelectorAll("[data-tag-mapping]").forEach((select) => {
        select.addEventListener("change", () => {
          const categoryId = select.dataset.tagMapping;
          if (!categoryId) return;
          screenState.tagFieldMappings = {
            ...screenState.tagFieldMappings,
            [categoryId]: select.value || "turnType",
          };
          emitCurrentState();
        });
      });
      inspector.querySelectorAll("[data-tag-scene-field]").forEach((button) => {
        button.addEventListener("click", () => {
          const sceneId = button.dataset.sceneId;
          const field = button.dataset.sceneFieldTarget;
          if (!goToAdaptationField(editor, screenState, sceneId, field)) return;
          activePanel = "acts";
          renderNavigator();
          renderInspector();
          focusActiveSceneField(field);
        });
      });
      inspector.querySelectorAll("[data-tag-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          screenState.activeTagFilter = button.dataset.tagFilter || "all";
          renderInspector();
        });
      });
      inspector.querySelectorAll('[data-tag-field="category"]').forEach((select) => {
        select.addEventListener("change", () => {
          const tagId = select.closest("[data-tag-id]")?.dataset.tagId;
          if (!tagId) return;
          setTagCategory(screenState, tagId, select.value || "writing");
          emitCurrentState();
        });
      });
      inspector.querySelectorAll("[data-tag-delete-hit]").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.tagDeleteHit;
          if (!tagId) return;
          const range = findMarkRangeAtSelection(editor, "productionTag", "tagId", tagId);
          if (!range) return;
          removeMarkRange(editor, "productionTag", range);
          emitCurrentState();
        });
      });
      inspector.querySelectorAll("[data-tag-jump]").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.tagJump;
          if (!tagId) return;
          const occurrence = findMarkOccurrence(editor, "productionTag", "tagId", tagId);
          if (!occurrence) return;
          screenState.activeTagId = tagId;
          editor.chain().focus(occurrence.from).setTextSelection({ from: occurrence.from, to: occurrence.to }).run();
          renderNavigator();
          renderInspector();
        });
      });
      inspector.querySelectorAll("[data-tag-jump-next]").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.tagJumpNext;
          if (!tagId) return;
          const current = findMarkRangeAtSelection(editor, "productionTag", "tagId", tagId);
          const occurrence = findNextMarkOccurrenceInDoc(editor.state.doc, editor.state.schema.marks.productionTag, "tagId", tagId, current);
          if (!occurrence) return;
          screenState.activeTagId = tagId;
          editor.chain().focus(occurrence.from).setTextSelection({ from: occurrence.from, to: occurrence.to }).run();
          renderNavigator();
          renderInspector();
        });
      });
      inspector.querySelectorAll("[data-tag-delete]").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.tagDelete;
          if (!tagId) return;
          removeMarksById(editor, "productionTag", "tagId", tagId);
          deleteTag(screenState, tagId);
          emitCurrentState();
        });
      });
      inspector.querySelectorAll("[data-tag-id]").forEach((wrapper) => {
        const tagId = wrapper.dataset.tagId;
        const nameInput = wrapper.querySelector('[data-tag-field="name"]');
        const notesInput = wrapper.querySelector('[data-tag-field="notes"]');
        if (nameInput && tagId) {
          nameInput.addEventListener("change", () => {
            updateTag(screenState, tagId, { name: nameInput.value, text: nameInput.value });
            emitCurrentState();
          });
        }
        if (notesInput && tagId) {
          notesInput.addEventListener("change", () => {
            updateTag(screenState, tagId, { notes: notesInput.value });
            emitCurrentState();
          });
        }
      });
    }
  }

  function emitCurrentState() {
    const screenplayDoc = normalizeScreenplayDocStructure(editor.getJSON());
    lastSerialized = serializeDoc(screenplayDoc);
    options.onChange?.({
      screenplayDoc,
      fountain: exportScreenplayDocToFountain(screenplayDoc),
      navigation: extractSceneNavigation(screenplayDoc),
      scriptNotes: screenState.scriptNotes,
      tagCategories: screenState.tagCategories,
      tagFieldMappings: screenState.tagFieldMappings,
      tags: screenState.tags,
    });
    renderNavigator();
    renderInspector();
  }

  function update(screenplayDoc) {
    const nextState = screenplayDoc?.type === "doc" || screenplayDoc?.content ? { screenplayDoc } : (screenplayDoc || {});
    syncScreenStateFromOptions(screenState, nextState);
    const nextWritingType = nextState.writingType || activeWritingType;
    if (nextWritingType !== activeWritingType) {
      activeWritingType = nextWritingType;
      root.querySelector(".screenplay-toolbar").innerHTML = getPrimaryTools(activeWritingType)
        .map((tool) => `<button class="screenplay-tool" data-action="${tool.action}">${tool.label}</button>`)
        .join("");
      root.querySelector(".screenplay-toolbar.secondary").innerHTML = getSecondaryTools(activeWritingType)
        .map((tool) => `<button class="screenplay-tool subtle" data-action="${tool.action}">${tool.label}</button>`)
        .join("");
      bindActionButtons();
    }
    const nextDoc = normalizeScreenplayDoc(nextState.screenplayDoc);
    const nextSerialized = serializeDoc(nextDoc);
    if (nextSerialized === lastSerialized) {
      renderNavigator();
      renderInspector();
      return;
    }
    isSyncing = true;
    editor.commands.setContent(nextDoc, false);
    lastSerialized = serializeDoc(editor.getJSON());
    isSyncing = false;
    renderNavigator();
    renderInspector();
  }

  return {
    root,
    update,
    focus() {
      editor.commands.focus();
    },
    destroy() {
      editor.destroy();
      root.innerHTML = "";
    },
  };
}

function applyToolbarAction(editor, action, screenState) {
  if (!action) return;

  if ([
    "sceneHeading",
    "action",
    "character",
    "dialogue",
    "parenthetical",
    "transition",
    "shot",
  ].includes(action)) {
    editor.chain().focus().setNode(action).run();
    return;
  }

  if (action === "jumpPrevScene" || action === "jumpNextScene") {
    jumpScene(editor, screenState, action === "jumpNextScene" ? 1 : -1);
    return;
  }

  if (action === "scriptNote") {
    const selection = editor.state.selection;
    const anchorText = editor.state.doc.textBetween(selection.from, selection.to, " ").trim();
    if (!anchorText) return;
    const existingNoteId = findMarkIdAtSelection(editor, "scriptNote", "noteId");
    if (existingNoteId) {
      screenState.activeNoteId = existingNoteId;
      return;
    }
    const noteId = `note-${Date.now()}`;
    screenState.scriptNotes = [
      ...screenState.scriptNotes,
      {
        id: noteId,
        content: "",
        color: "#f4d35e",
        anchorText,
        sceneId: findSceneIdAtPos(editor, selection.from),
        elementType: getSelectionElementType(editor),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    screenState.activeNoteId = noteId;
    editor.chain().focus().setMark("scriptNote", {
      noteId,
      color: "#f4d35e",
    }).run();
    return;
  }

  if (action === "productionTag") {
    const selection = editor.state.selection;
    const anchorText = editor.state.doc.textBetween(selection.from, selection.to, " ").trim();
    if (!anchorText) return;
    const existingTagId = findMarkIdAtSelection(editor, "productionTag", "tagId");
    if (existingTagId) {
      screenState.activeTagId = existingTagId;
      return;
    }
    const tagId = `tag-${Date.now()}`;
    if (!screenState.tagCategories.some((category) => category.id === "writing")) {
      screenState.tagCategories = [...screenState.tagCategories, { id: "writing", name: "Writing", color: "#2f6f6d" }];
    }
    screenState.tags = [
      ...screenState.tags,
      {
        id: tagId,
        categoryId: "writing",
        name: anchorText,
        text: anchorText,
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    screenState.activeTagId = tagId;
    editor.chain().focus().setMark("productionTag", {
      tagId,
      categoryId: "writing",
      color: "#2f6f6d",
    }).run();
    return;
  }

  if (action === "insertTitlePage") {
    editor.chain().focus("start").insertContent({
      type: "titlePage",
      attrs: {
        field: "title",
        tpTitle: "",
        tpWrittenBy: "",
        tpBasedOn: "",
        tpDraft: "",
        tpDraftDate: "",
        tpContact: "",
        tpCopyright: "",
        tpWgaRegistration: "",
        tpNotes: "",
        tpTitleFontSize: 12,
      },
      content: [],
    }).run();
    return;
  }

  if (action === "insertNewAct") {
    const count = getNodeCount(editor, "newAct") + 1;
    editor.chain().focus().insertContent({
      type: "newAct",
      attrs: {
        actNumber: count,
        actName: `ACT ${count}`,
        customName: "",
      },
      content: [{ type: "text", text: `ACT ${count}` }],
    }).run();
    normalizeEditorDoc(editor);
    return;
  }

  if (action === "insertEndOfAct") {
    const count = Math.max(getNodeCount(editor, "newAct"), 1);
    editor.chain().focus().insertContent({
      type: "endOfAct",
      attrs: {
        actNumber: count,
        actName: `END OF ACT ${count}`,
      },
      content: [{ type: "text", text: `END OF ACT ${count}` }],
    }).run();
    normalizeEditorDoc(editor);
  }
}

function getNodeCount(editor, nodeName) {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === nodeName) count += 1;
  });
  return count;
}

function getSceneEntries(editor) {
  const entries = [];
  let currentActNumber = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "newAct") {
      currentActNumber = Number(node.attrs?.actNumber || entries.filter((entry) => entry.actLabel).length + 1);
      return;
    }
    if (node.type.name === "endOfAct") {
      currentActNumber = null;
      return;
    }
    if (node.type.name !== "sceneHeading") return;
    entries.push({
      id: node.attrs.id || `scene-${entries.length + 1}`,
      title: node.textContent.trim(),
      index: entries.length + 1,
      actLabel: currentActNumber ? `A${currentActNumber}` : "",
      synopsis: node.attrs?.synopsis || "",
      adaptationFunction: node.attrs?.adaptationFunction || "",
      sourceReference: node.attrs?.sourceReference || "",
      turnType: node.attrs?.turnType || "",
      conflictGoal: node.attrs?.conflictGoal || "",
      exitChange: node.attrs?.exitChange || "",
      pos,
    });
  });
  return entries;
}

function normalizeScreenplayDoc(screenplayDoc) {
  if (screenplayDoc?.content?.length) return normalizeScreenplayDocStructure(screenplayDoc);
  const fountain = exportScreenplayDocToFountain(screenplayDoc);
  return createScreenplayDocFromFountain(fountain);
}

function serializeDoc(screenplayDoc) {
  return JSON.stringify(screenplayDoc || {});
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createInitialScreenState(options) {
  return {
    scriptNotes: Array.isArray(options.scriptNotes) ? options.scriptNotes.map((note) => ({ ...note })) : [],
    tagCategories: Array.isArray(options.tagCategories) && options.tagCategories.length
      ? options.tagCategories.map((category) => ({ ...category }))
      : [{ id: "writing", name: "Writing", color: "#2f6f6d" }],
    tags: Array.isArray(options.tags) ? options.tags.map((tag) => ({ ...tag })) : [],
    tagFieldMappings: {
      ...DEFAULT_TAG_FIELD_MAPPINGS,
      ...(options.tagFieldMappings || {}),
    },
    activeSceneId: null,
    activeNoteId: null,
    activeNoteSceneFilter: false,
    activeTagId: null,
    activeTagFilter: "all",
    activeTagSceneFilter: false,
  };
}

function syncScreenStateFromOptions(screenState, options) {
  if (Array.isArray(options.scriptNotes)) {
    screenState.scriptNotes = options.scriptNotes.map((note) => ({ ...note }));
  }
  if (typeof options.activeNoteSceneFilter === "boolean") screenState.activeNoteSceneFilter = options.activeNoteSceneFilter;
  if (Array.isArray(options.tagCategories)) {
    screenState.tagCategories = options.tagCategories.length
      ? options.tagCategories.map((category) => ({ ...category }))
      : [{ id: "writing", name: "Writing", color: "#2f6f6d" }];
  }
  if (Array.isArray(options.tags)) {
    screenState.tags = options.tags.map((tag) => ({ ...tag }));
  }
  if (options.tagFieldMappings && typeof options.tagFieldMappings === "object") {
    screenState.tagFieldMappings = {
      ...DEFAULT_TAG_FIELD_MAPPINGS,
      ...options.tagFieldMappings,
    };
  }
  if (typeof options.activeTagSceneFilter === "boolean") screenState.activeTagSceneFilter = options.activeTagSceneFilter;
}

function syncScreenStateFromDoc(screenState, screenplayDoc) {
  const navigation = extractSceneNavigation(screenplayDoc);
  if (!screenState.activeSceneId && navigation[0]) {
    screenState.activeSceneId = navigation[0].id;
  }
}

function syncActiveSceneFromSelection(editor, screenState) {
  const sceneId = findSceneIdAtPos(editor, editor.state.selection.from);
  if (sceneId) screenState.activeSceneId = sceneId;
  screenState.activeNoteId = findMarkIdAtSelection(editor, "scriptNote", "noteId");
  screenState.activeTagId = findMarkIdAtSelection(editor, "productionTag", "tagId");
}

function panelLabel(panel) {
  return {
    title: "Title",
    acts: "Acts",
    notes: "Notes",
    tags: "Tags",
  }[panel] || panel;
}

function renderInspectorPanel(activePanel, editor, screenState) {
  if (activePanel === "title") {
    const titlePage = getTitlePageAttrs(editor);
    return `
      <div class="inspector-panel">
        <div class="panel-title">Title Page</div>
        ${renderTitleField("标题", "tpTitle", titlePage.tpTitle)}
        ${renderTitleField("作者", "tpWrittenBy", titlePage.tpWrittenBy)}
        ${renderTitleField("改编来源", "tpBasedOn", titlePage.tpBasedOn)}
        ${renderTitleField("稿次", "tpDraft", titlePage.tpDraft)}
        ${renderTitleField("日期", "tpDraftDate", titlePage.tpDraftDate)}
        ${renderTitleField("联系", "tpContact", titlePage.tpContact, true)}
        ${renderTitleField("版权", "tpCopyright", titlePage.tpCopyright)}
        ${renderTitleField("WGA/备案", "tpWgaRegistration", titlePage.tpWgaRegistration)}
        ${renderTitleField("备注", "tpNotes", titlePage.tpNotes, true)}
      </div>
    `;
  }

  if (activePanel === "acts") {
    const scenes = extractSceneNavigation(editor.getJSON());
    const activeScene = scenes.find((scene) => scene.id === screenState.activeSceneId) || scenes[0] || null;
    const activeSceneLinks = activeScene
      ? countSceneLinkedItems({ sceneId: activeScene.id, scriptNotes: screenState.scriptNotes, tags: screenState.tags })
      : { notes: 0, tags: 0 };
    const activeSceneFirstNoteId = activeScene ? findFirstSceneLinkedItemId(screenState.scriptNotes, activeScene.id) : null;
    const activeSceneFirstTagId = activeScene ? findFirstSceneLinkedItemId(screenState.tags, activeScene.id) : null;
    return `
      <div class="inspector-panel">
        <div class="panel-title">${activeWritingType === "literary-screenplay" ? "改编分场台" : "Acts"}</div>
        ${
          activeWritingType === "literary-screenplay" && activeScene
            ? `
              <div class="adaptation-scene-panel" data-scene-edit-id="${escapeHtml(activeScene.id)}">
                <div class="adaptation-scene-head">
                  <strong>${activeScene.index}. ${escapeHtml(activeScene.title)}</strong>
                  <small>${escapeHtml(activeScene.actLabel || "未分幕")} ${activeScene.location ? `· ${escapeHtml(activeScene.location)}` : ""}${activeScene.time ? ` · ${escapeHtml(activeScene.time)}` : ""}</small>
                </div>
                <div class="title-field">
                  <label class="field-label">场次功能</label>
                  <input class="input" data-scene-field="adaptationFunction" value="${escapeHtml(activeScene.adaptationFunction || "")}" />
                </div>
                <div class="title-field">
                  <label class="field-label">母本对应</label>
                  <input class="input" data-scene-field="sourceReference" value="${escapeHtml(activeScene.sourceReference || "")}" />
                </div>
                <div class="title-field">
                  <label class="field-label">转折类型</label>
                  <input class="input" data-scene-field="turnType" value="${escapeHtml(activeScene.turnType || "")}" />
                </div>
                <div class="title-field">
                  <label class="field-label">冲突目标</label>
                  <input class="input" data-scene-field="conflictGoal" value="${escapeHtml(activeScene.conflictGoal || "")}" />
                </div>
                <div class="title-field">
                  <label class="field-label">离场变化</label>
                  <input class="input" data-scene-field="exitChange" value="${escapeHtml(activeScene.exitChange || "")}" />
                </div>
                <div class="inspector-card-actions">
                  <button class="screenplay-tool subtle" data-scene-linked-notes="${escapeHtml(activeScene.id)}"${activeSceneLinks.notes ? "" : " disabled"}>Notes ${activeSceneLinks.notes}</button>
                  <button class="screenplay-tool subtle" data-scene-linked-tags="${escapeHtml(activeScene.id)}"${activeSceneLinks.tags ? "" : " disabled"}>Tags ${activeSceneLinks.tags}</button>
                </div>
                <input type="hidden" data-scene-first-note-id value="${escapeHtml(activeSceneFirstNoteId || "")}" />
                <input type="hidden" data-scene-first-tag-id value="${escapeHtml(activeSceneFirstTagId || "")}" />
              </div>
            `
            : ""
        }
        ${scenes.length
          ? scenes.map((scene) => `
              <button class="inspector-list-item${screenState.activeSceneId === scene.id ? " active" : ""}" data-act-jump="${escapeHtml(scene.id)}">
                <strong>${scene.index}. ${escapeHtml(scene.actLabel || "未分幕")} · ${escapeHtml(scene.title)}</strong>
                <small>${escapeHtml(scene.location || "")}${scene.time ? ` · ${escapeHtml(scene.time)}` : ""}</small>
                <small>${escapeHtml(scene.synopsis || "无 synopsis")}</small>
                ${activeWritingType === "literary-screenplay" ? `<small>${escapeHtml(scene.adaptationFunction || "未写场次功能")} · ${escapeHtml(scene.sourceReference || "未挂母本对应")} · ${escapeHtml(scene.turnType || "未写转折类型")}</small>` : ""}
                ${activeWritingType === "literary-screenplay" ? `<small>${escapeHtml(scene.conflictGoal || "未写冲突目标")} · ${escapeHtml(scene.exitChange || "未写离场变化")}</small>` : ""}
              </button>
            `).join("")
          : `<p class="empty">还没有可归属的场景。</p>`}
        ${activeWritingType === "literary-screenplay" ? `<div class="inspector-card-actions"><button class="screenplay-tool subtle" data-scene-shortcut-note>当前场景 Note</button><button class="screenplay-tool subtle" data-scene-shortcut-tag>当前场景 Tag</button></div>` : ""}
      </div>
    `;
  }

  if (activePanel === "notes") {
    const filteredNotes = filterItemsByScene(screenState.scriptNotes, screenState.activeSceneId, screenState.activeNoteSceneFilter);
    return `
      <div class="inspector-panel">
        <div class="panel-title">Notes</div>
        <div class="inspector-filter-row">
          <button class="screenplay-chip${screenState.activeNoteSceneFilter ? " active" : ""}" data-note-scene-filter="${screenState.activeNoteSceneFilter ? "off" : "on"}">当前场景</button>
        </div>
        ${filteredNotes.length
          ? filteredNotes.map((note) => `
              ${(() => {
                const hitCount = countMarkOccurrences(editor.state.doc, editor.state.schema.marks.scriptNote, "noteId", note.id);
                const canDeleteCurrent = screenState.activeNoteId === note.id;
                const sceneFieldTarget = resolveSceneFieldTargetFromNote(note);
                return `
              <div class="inspector-card${screenState.activeNoteId === note.id ? " active" : ""}" data-note-id="${escapeHtml(note.id)}">
                <div class="inspector-card-head">
                  <strong>${escapeHtml(note.anchorText || note.id)}</strong>
                  <input type="color" value="${escapeHtml(note.color || "#f4d35e")}" />
                </div>
                <div class="inspector-card-meta">${escapeHtml(note.sceneId || "未定位场景")} · ${escapeHtml(note.elementType || "action")} · ${hitCount} 命中</div>
                <textarea class="mini-editor">${escapeHtml(note.content || "")}</textarea>
                <div class="inspector-card-actions">
                  <button class="screenplay-tool subtle" data-note-jump="${escapeHtml(note.id)}">Jump</button>
                  <button class="screenplay-tool subtle" data-note-jump-next="${escapeHtml(note.id)}"${hitCount > 1 ? "" : " disabled"}>Next hit</button>
                  ${sceneFieldTarget ? `<button class="screenplay-tool subtle" data-note-scene-field="${escapeHtml(note.id)}" data-scene-id="${escapeHtml(sceneFieldTarget.sceneId)}" data-scene-field-target="${escapeHtml(sceneFieldTarget.field)}">回分场台</button>` : ""}
                  <button class="screenplay-tool subtle" data-note-delete-hit="${escapeHtml(note.id)}"${canDeleteCurrent ? "" : " disabled"}>删当前命中</button>
                  <button class="screenplay-tool subtle danger" data-note-delete="${escapeHtml(note.id)}">删整条</button>
                </div>
              </div>
            `;
              })()}
            `).join("")
          : `<p class="empty">${screenState.activeNoteSceneFilter ? "当前场景还没有 Note 命中。" : "选中文本后点 Note，会在这里出现。"}</p>`}
      </div>
    `;
  }

  const availableCategories = screenState.tagCategories.length
    ? screenState.tagCategories
    : [{ id: "writing", name: "Writing", color: "#2f6f6d" }];
  const filteredTags = filterItemsByScene(
    filterTagsByCategory(screenState.tags, screenState.activeTagFilter),
    screenState.activeSceneId,
    screenState.activeTagSceneFilter,
  );

  return `
    <div class="inspector-panel">
      <div class="panel-title">Tags</div>
      <div class="inspector-filter-row">
        <button class="screenplay-chip${screenState.activeTagFilter === "all" ? " active" : ""}" data-tag-filter="all">全部</button>
        ${availableCategories.map((category) => `
          <button class="screenplay-chip${screenState.activeTagFilter === category.id ? " active" : ""}" data-tag-filter="${escapeHtml(category.id)}">${escapeHtml(category.name)}</button>
        `).join("")}
        <button class="screenplay-chip${screenState.activeTagSceneFilter ? " active" : ""}" data-tag-scene-filter="${screenState.activeTagSceneFilter ? "off" : "on"}">当前场景</button>
      </div>
      <div class="workflow-panel">
        ${availableCategories.map((category) => `
          <div class="title-field">
            <label class="field-label">${escapeHtml(category.name)} 挂载字段</label>
            <select class="input" data-tag-mapping="${escapeHtml(category.id)}">
              ${TAG_FIELD_OPTIONS.map((option) => `
                <option value="${escapeHtml(option.value)}"${(screenState.tagFieldMappings?.[category.id] || DEFAULT_TAG_FIELD_MAPPINGS[category.id] || "turnType") === option.value ? " selected" : ""}>${escapeHtml(option.label)}</option>
              `).join("")}
            </select>
          </div>
        `).join("")}
      </div>
      ${filteredTags.length
        ? filteredTags.map((tag) => `
            ${(() => {
              const hitCount = countMarkOccurrences(editor.state.doc, editor.state.schema.marks.productionTag, "tagId", tag.id);
              const canDeleteCurrent = screenState.activeTagId === tag.id;
              const sceneFieldTarget = resolveSceneFieldTargetFromTag(tag, screenState.tagFieldMappings);
              return `
            <div class="inspector-card${screenState.activeTagId === tag.id ? " active" : ""}" data-tag-id="${escapeHtml(tag.id)}">
              <div class="inspector-card-meta">${escapeHtml(tag.categoryId || "writing")} · ${hitCount} 命中</div>
              <input class="input" data-tag-field="name" value="${escapeHtml(tag.name || tag.text || "")}" />
              <select class="input" data-tag-field="category">
                ${availableCategories.map((category) => `
                  <option value="${escapeHtml(category.id)}"${(tag.categoryId || "writing") === category.id ? " selected" : ""}>${escapeHtml(category.name)}</option>
                `).join("")}
              </select>
              <textarea class="mini-editor" data-tag-field="notes">${escapeHtml(tag.notes || "")}</textarea>
              <div class="inspector-card-actions">
                <button class="screenplay-tool subtle" data-tag-jump="${escapeHtml(tag.id)}">Jump</button>
                <button class="screenplay-tool subtle" data-tag-jump-next="${escapeHtml(tag.id)}"${hitCount > 1 ? "" : " disabled"}>Next hit</button>
                ${sceneFieldTarget ? `<button class="screenplay-tool subtle" data-tag-scene-field="${escapeHtml(tag.id)}" data-scene-id="${escapeHtml(sceneFieldTarget.sceneId)}" data-scene-field-target="${escapeHtml(sceneFieldTarget.field)}">回分场台</button>` : ""}
                <button class="screenplay-tool subtle" data-tag-delete-hit="${escapeHtml(tag.id)}"${canDeleteCurrent ? "" : " disabled"}>删当前命中</button>
                <button class="screenplay-tool subtle danger" data-tag-delete="${escapeHtml(tag.id)}">删整条</button>
              </div>
            </div>
          `;
            })()}
          `).join("")
        : `<p class="empty">${screenState.activeTagSceneFilter ? "当前场景还没有 Tag 命中。" : "选中文本后点 Tag，会在这里出现。"}</p>`}
    </div>
  `;
}

function renderTitleField(label, field, value, multiline = false) {
  return multiline
    ? `<div class="title-field"><label class="field-label">${label}</label><textarea class="mini-editor" data-title-field="${field}">${escapeHtml(value || "")}</textarea></div>`
    : `<div class="title-field"><label class="field-label">${label}</label><input class="input" data-title-field="${field}" value="${escapeHtml(value || "")}" /></div>`;
}

function getTitlePageAttrs(editor) {
  return getTitlePageAttrsFromDoc(editor.state.doc);
}

function getTitlePageAttrsFromDoc(doc) {
  let attrs = {
    tpTitle: "",
    tpWrittenBy: "",
    tpBasedOn: "",
    tpDraft: "",
    tpDraftDate: "",
    tpContact: "",
    tpCopyright: "",
    tpWgaRegistration: "",
    tpNotes: "",
  };
  doc.descendants((node) => {
    if (node.type.name === "titlePage" && node.attrs?.field === "title") {
      attrs = {
        ...attrs,
        tpTitle: node.attrs?.tpTitle || "",
        tpWrittenBy: node.attrs?.tpWrittenBy || "",
        tpBasedOn: node.attrs?.tpBasedOn || "",
        tpDraft: node.attrs?.tpDraft || "",
        tpDraftDate: node.attrs?.tpDraftDate || "",
        tpContact: node.attrs?.tpContact || "",
        tpCopyright: node.attrs?.tpCopyright || "",
        tpWgaRegistration: node.attrs?.tpWgaRegistration || "",
        tpNotes: node.attrs?.tpNotes || "",
      };
      return false;
    }
    return true;
  });
  return attrs;
}

function updateTitlePageField(editor, field, value) {
  let updated = false;
  editor.chain().command(({ tr }) => {
    tr.doc.descendants((node, pos) => {
      if (node.type.name !== "titlePage" || node.attrs?.field !== "title") return;
      const attrs = {
        ...node.attrs,
        [field]: value,
      };
      if (field === "tpTitle") {
        if (value) {
          tr.replaceWith(pos + 1, pos + node.nodeSize - 1, tr.doc.type.schema.text(value));
        } else {
          tr.delete(pos + 1, pos + node.nodeSize - 1);
        }
      }
      tr.setNodeMarkup(pos, undefined, attrs);
      updated = true;
      return false;
    });
    return true;
  }).run();

  if (!updated) {
    editor.chain().focus("start").insertContent({
      type: "titlePage",
      attrs: {
        field: "title",
        tpTitle: field === "tpTitle" ? value : "",
        tpWrittenBy: field === "tpWrittenBy" ? value : "",
        tpBasedOn: field === "tpBasedOn" ? value : "",
        tpDraft: field === "tpDraft" ? value : "",
        tpDraftDate: field === "tpDraftDate" ? value : "",
        tpContact: field === "tpContact" ? value : "",
        tpCopyright: "",
        tpWgaRegistration: "",
        tpNotes: "",
        tpTitleFontSize: 12,
      },
      content: field === "tpTitle" && value ? [{ type: "text", text: value }] : [],
    }).run();
  }
}

function updateScreenNote(screenState, noteId, patch) {
  screenState.scriptNotes = screenState.scriptNotes.map((note) => (note.id === noteId ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note));
}

function updateTag(screenState, tagId, patch) {
  screenState.tags = screenState.tags.map((tag) => (tag.id === tagId ? { ...tag, ...patch, updatedAt: new Date().toISOString() } : tag));
}

function getSceneContextFromDoc(doc, sceneId) {
  let found = null;
  doc.descendants((node) => {
    if (node.type.name !== "sceneHeading" || node.attrs?.id !== sceneId) return true;
    found = {
      id: sceneId,
      title: node.textContent.trim(),
      adaptationFunction: node.attrs?.adaptationFunction || "",
      sourceReference: node.attrs?.sourceReference || "",
      turnType: node.attrs?.turnType || "",
      conflictGoal: node.attrs?.conflictGoal || "",
      exitChange: node.attrs?.exitChange || "",
    };
    return false;
  });
  return found;
}

function updateSceneAttrsInDoc(doc, sceneId, patch) {
  const tr = new Transform(doc);
  doc.descendants((node, pos) => {
    if (node.type.name !== "sceneHeading" || node.attrs?.id !== sceneId) return true;
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...patch });
    return false;
  });
  return tr.doc;
}

function createSceneShortcutNote(editor, screenState) {
  const sceneId = screenState.activeSceneId || findSceneIdAtPos(editor, editor.state.selection.from);
  if (!sceneId) return null;
  const sceneContext = getSceneContextFromDoc(editor.state.doc, sceneId);
  if (!sceneContext) return null;
  const sceneRange = findSceneHeadingRange(editor.state.doc, sceneId);
  if (!sceneRange) return null;
  const noteId = `note-${Date.now()}`;
  screenState.scriptNotes = [
    ...screenState.scriptNotes,
    {
      id: noteId,
      content: `场次功能：${sceneContext.adaptationFunction || ""}\n母本对应：${sceneContext.sourceReference || ""}\n转折类型：${sceneContext.turnType || ""}\n冲突目标：${sceneContext.conflictGoal || ""}\n离场变化：${sceneContext.exitChange || ""}`.trim(),
      color: "#f4d35e",
      anchorText: sceneContext.title,
      sceneId,
      elementType: "sceneHeading",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  screenState.activeNoteId = noteId;
  if (typeof editor.chain === "function") {
    editor.chain().focus(sceneRange.from).setTextSelection({ from: sceneRange.from, to: sceneRange.to }).setMark("scriptNote", {
      noteId,
      color: "#f4d35e",
    }).run();
  }
  return noteId;
}

function createSceneShortcutTag(editor, screenState) {
  const sceneId = screenState.activeSceneId || findSceneIdAtPos(editor, editor.state.selection.from);
  if (!sceneId) return null;
  const sceneContext = getSceneContextFromDoc(editor.state.doc, sceneId);
  if (!sceneContext) return null;
  const sceneRange = findSceneHeadingRange(editor.state.doc, sceneId);
  if (!sceneRange) return null;
  const tagId = `tag-${Date.now()}`;
  screenState.tags = [
    ...screenState.tags,
    {
      id: tagId,
      name: sceneContext.turnType || sceneContext.adaptationFunction || "场次标记",
      text: sceneContext.title,
      notes: `母本对应：${sceneContext.sourceReference || ""}\n冲突目标：${sceneContext.conflictGoal || ""}\n离场变化：${sceneContext.exitChange || ""}`.trim(),
      categoryId: "writing",
      sceneId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  screenState.activeTagId = tagId;
  if (typeof editor.chain === "function") {
    editor.chain().focus(sceneRange.from).setTextSelection({ from: sceneRange.from, to: sceneRange.to }).setMark("productionTag", {
      tagId,
      categoryId: "writing",
      color: "#2f6f6d",
    }).run();
  }
  return tagId;
}

function deleteScreenNote(screenState, noteId) {
  screenState.scriptNotes = screenState.scriptNotes.filter((note) => note.id !== noteId);
  if (screenState.activeNoteId === noteId) screenState.activeNoteId = null;
}

function deleteTag(screenState, tagId) {
  screenState.tags = screenState.tags.filter((tag) => tag.id !== tagId);
  if (screenState.activeTagId === tagId) screenState.activeTagId = null;
}

function resolveSceneFieldTargetFromNote(note) {
  if (!note?.sceneId || note.elementType !== "sceneHeading") return null;
  return {
    sceneId: note.sceneId,
    field: "adaptationFunction",
  };
}

function resolveSceneFieldTargetFromTag(tag, tagFieldMappings = DEFAULT_TAG_FIELD_MAPPINGS) {
  if (!tag?.sceneId) return null;
  const field = (tagFieldMappings && tagFieldMappings[tag.categoryId || "writing"]) || "turnType";
  return {
    sceneId: tag.sceneId,
    field,
  };
}

function setTagCategory(screenState, tagId, categoryId) {
  screenState.tags = screenState.tags.map((tag) => (
    tag.id === tagId ? { ...tag, categoryId, updatedAt: new Date().toISOString() } : tag
  ));
}

function syncMarksColor(editor, markName, idField, id, attrs) {
  const markType = editor.state.schema.marks[markName];
  if (!markType) return;
  editor.chain().command(({ tr }) => {
    tr.doc.descendants((node, pos) => {
      if (!node.isText) return;
      const mark = node.marks.find((item) => item.type === markType && item.attrs?.[idField] === id);
      if (!mark) return;
      tr.removeMark(pos, pos + node.nodeSize, mark);
      tr.addMark(pos, pos + node.nodeSize, markType.create(attrs));
    });
    return true;
  }).run();
}

function removeMarksById(editor, markName, idField, id) {
  const markType = editor.state.schema.marks[markName];
  if (!markType) return false;
  const ranges = collectMarkRanges(editor.state.doc, markType, idField, id);
  if (!ranges.length) return false;
  editor.chain().command(({ tr }) => {
    for (const range of ranges) {
      tr.removeMark(range.from, range.to, markType.create(range.attrs));
    }
    return true;
  }).run();
  return true;
}

function removeMarkRangeFromDoc(doc, markType, range) {
  if (!markType || !range) return doc;
  const tr = new Transform(doc);
  tr.removeMark(range.from, range.to, markType.create(range.attrs || {}));
  return tr.doc;
}

function removeMarkRange(editor, markName, range) {
  const markType = editor.state.schema.marks[markName];
  if (!markType || !range) return false;
  editor.chain().command(({ tr }) => {
    tr.removeMark(range.from, range.to, markType.create(range.attrs || {}));
    return true;
  }).run();
  return true;
}

function findMarkOccurrence(editor, markName, idField, id) {
  const markType = editor.state.schema.marks[markName];
  if (!markType) return null;
  return findMarkOccurrenceInDoc(editor.state.doc, markType, idField, id);
}

function jumpScene(editor, screenState, direction) {
  const scenes = getSceneEntries(editor);
  const { from } = editor.state.selection;
  const currentIndex = scenes.findIndex((scene) => scene.pos + 1 >= from);
  const baseIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = Math.min(Math.max(baseIndex + direction, 0), Math.max(scenes.length - 1, 0));
  const nextScene = scenes[nextIndex];
  if (!nextScene) return;
  screenState.activeSceneId = nextScene.id;
  editor.chain().focus(nextScene.pos + 1).run();
}

function normalizeEditorDoc(editor) {
  const normalized = normalizeScreenplayDocStructure(editor.getJSON());
  editor.commands.setContent(normalized, false);
}

function getSelectionElementType(editor) {
  const { from } = editor.state.selection;
  const resolved = editor.state.doc.resolve(from);
  return resolved.parent?.type?.name || "action";
}

function findMarkIdAtSelection(editor, markName, idField) {
  const markType = editor.state.schema.marks[markName];
  if (!markType) return null;
  const { from, to, empty } = editor.state.selection;
  return findMarkIdInDocSelection(editor.state.doc, markType, idField, from, to, empty);
}

function findMarkRangeAtSelection(editor, markName, idField, id) {
  const markType = editor.state.schema.marks[markName];
  if (!markType) return null;
  const { from, to, empty } = editor.state.selection;
  return collectMarkRanges(editor.state.doc, markType, idField, id).find((range) => (
    empty
      ? range.from <= from && from <= range.to
      : !(range.to <= from || range.from >= to)
  )) || null;
}

function findSceneIdAtPos(editor, pos) {
  let sceneId = null;
  editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === "sceneHeading" && nodePos <= pos) {
      sceneId = node.attrs?.id || sceneId;
    }
  });
  return sceneId;
}

function findSceneHeadingRange(doc, sceneId) {
  let range = null;
  doc.descendants((node, pos) => {
    if (node.type.name !== "sceneHeading" || node.attrs?.id !== sceneId) return true;
    range = {
      from: pos + 1,
      to: pos + node.nodeSize - 1,
    };
    return false;
  });
  return range;
}

function goToAdaptationField(editor, screenState, sceneId, field) {
  if (!sceneId || !field) return false;
  const sceneEntry = getSceneEntries(editor).find((entry) => entry.id === sceneId);
  if (!sceneEntry) return false;
  screenState.activeSceneId = sceneId;
  editor.chain().focus(sceneEntry.pos + 1).run();
  return true;
}

function countSceneLinkedItems({ sceneId, scriptNotes = [], tags = [] }) {
  return {
    notes: scriptNotes.filter((note) => note.sceneId === sceneId).length,
    tags: tags.filter((tag) => tag.sceneId === sceneId).length,
  };
}

function findFirstSceneLinkedItemId(items = [], sceneId) {
  return items.find((item) => item.sceneId === sceneId)?.id || null;
}

function filterItemsByScene(items = [], sceneId, enabled = false) {
  if (!enabled || !sceneId) return items.slice();
  return items.filter((item) => item.sceneId === sceneId);
}

function reconcileScreenStateWithMarks(editor, screenState) {
  const noteType = editor.state.schema.marks.scriptNote;
  const tagType = editor.state.schema.marks.productionTag;
  const knownNoteIds = new Set(screenState.scriptNotes.map((note) => note.id));
  const knownTagIds = new Set(screenState.tags.map((tag) => tag.id));

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    for (const mark of node.marks) {
      if (noteType && mark.type === noteType && mark.attrs?.noteId && !knownNoteIds.has(mark.attrs.noteId)) {
        screenState.scriptNotes.push({
          id: mark.attrs.noteId,
          content: "",
          color: mark.attrs.color || "#f4d35e",
          anchorText: node.textContent || "",
          sceneId: findSceneIdAtPos(editor, pos),
          elementType: "action",
          createdAt: "",
          updatedAt: "",
        });
        knownNoteIds.add(mark.attrs.noteId);
      }
      if (tagType && mark.type === tagType && mark.attrs?.tagId && !knownTagIds.has(mark.attrs.tagId)) {
        const categoryId = mark.attrs.categoryId || "writing";
        if (!screenState.tagCategories.some((category) => category.id === categoryId)) {
          screenState.tagCategories.push({ id: categoryId, name: categoryId, color: mark.attrs.color || "#2f6f6d" });
        }
        screenState.tags.push({
          id: mark.attrs.tagId,
          categoryId,
          name: node.textContent || mark.attrs.tagId,
          text: node.textContent || "",
          notes: "",
          createdAt: "",
          updatedAt: "",
        });
        knownTagIds.add(mark.attrs.tagId);
      }
    }
  });
}

function collectMarkRanges(doc, markType, idField, id) {
  const ranges = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const mark = node.marks.find((item) => item.type === markType && item.attrs?.[idField] === id);
    if (!mark) return;
    ranges.push({
      from: pos,
      to: pos + node.nodeSize,
      attrs: { ...mark.attrs },
    });
  });
  return ranges;
}

function countMarkOccurrences(doc, markType, idField, id) {
  return collectMarkRanges(doc, markType, idField, id).length;
}

function findMarkOccurrenceInDoc(doc, markType, idField, id) {
  let found = null;
  doc.descendants((node, pos) => {
    if (!node.isText || found) return;
    const mark = node.marks.find((item) => item.type === markType && item.attrs?.[idField] === id);
    if (!mark) return;
    found = {
      from: pos,
      to: pos + node.nodeSize,
      text: node.textContent || "",
      attrs: { ...mark.attrs },
    };
  });
  return found;
}

function findMarkIdInDocSelection(doc, markType, idField, from, to, empty) {
  let foundId = null;
  doc.nodesBetween(from, to, (node) => {
    if (!node.isText || foundId) return false;
    const mark = node.marks.find((item) => item.type === markType && item.attrs?.[idField]);
    if (!mark) return;
    foundId = mark.attrs[idField];
    return false;
  });
  if (foundId || !empty) return foundId;
  const $from = doc.resolve(from);
  const marks = $from.marks();
  const mark = marks.find((item) => item.type === markType && item.attrs?.[idField]);
  return mark?.attrs?.[idField] || null;
}

function filterTagsByCategory(tags, categoryId) {
  if (!categoryId || categoryId === "all") return tags.slice();
  return tags.filter((tag) => (tag.categoryId || "writing") === categoryId);
}

function findNextMarkOccurrenceInDoc(doc, markType, idField, id, current = null) {
  const ranges = collectMarkRanges(doc, markType, idField, id);
  if (!ranges.length) return null;
  if (!current) {
    const first = ranges[0];
    return {
      ...first,
      text: doc.textBetween(first.from, first.to, " "),
    };
  }
  const next = ranges.find((range) => range.from > current.from) || ranges[0];
  return {
    ...next,
    text: doc.textBetween(next.from, next.to, " "),
  };
}

export function __testHelpers() {
  return {
    countSceneLinkedItems,
    createSceneShortcutNote,
    createSceneShortcutTag,
    collectMarkRanges,
    countMarkOccurrences,
    filterTagsByCategory,
    findSceneHeadingRange,
    findNextMarkOccurrenceInDoc,
    findMarkOccurrenceInDoc,
    findMarkIdInDocSelection,
    getSceneContextFromDoc,
    getTitlePageAttrsFromDoc,
    goToAdaptationField,
    findFirstSceneLinkedItemId,
    filterItemsByScene,
    deleteScreenNote,
    deleteTag,
    removeMarkRangeFromDoc,
    resolveSceneFieldTargetFromNote,
    resolveSceneFieldTargetFromTag,
    setTagCategory,
    updateSceneAttrsInDoc,
  };
}
