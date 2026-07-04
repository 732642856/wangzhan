import { Mark, Node } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import History from "@tiptap/extension-history";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import TextStyle from "@tiptap/extension-text-style";

function createBlockNode(name, options = {}) {
  const {
    attributes = {},
    htmlTag = "div",
    dataType = name,
    className = `screenplay-element ${name}`,
    onTab = null,
  } = options;

  return Node.create({
    name,
    group: "block",
    content: "text*",
    defining: true,
    addAttributes() {
      return attributes;
    },
    parseHTML() {
      return [{ tag: `${htmlTag}[data-type="${dataType}"]` }];
    },
    renderHTML({ HTMLAttributes, node }) {
      const attrs = {
        ...HTMLAttributes,
        "data-type": dataType,
        class: className,
      };
      if (name === "sceneHeading" && node.attrs?.id) attrs["data-scene-id"] = node.attrs.id;
      if (name === "sceneHeading" && node.attrs?.synopsis) attrs["data-synopsis"] = node.attrs.synopsis;
      if (name === "titlePage" && node.attrs?.field) attrs["data-field"] = node.attrs.field;
      if (name === "newAct" && node.attrs?.actNumber != null) attrs["data-act-number"] = String(node.attrs.actNumber);
      if (name === "endOfAct" && node.attrs?.actNumber != null) attrs["data-act-number"] = String(node.attrs.actNumber);
      return [htmlTag, attrs, 0];
    },
    addKeyboardShortcuts() {
      if (!onTab) return {};
      return {
        Tab: ({ editor }) => {
          if (!editor.isActive(name)) return false;
          return editor.chain().splitBlock().setNode(onTab).run();
        },
      };
    },
  });
}

function createInlineMark(name, options = {}) {
  const {
    parseTag,
    className,
    attributes = {},
  } = options;

  return Mark.create({
    name,
    excludes: "",
    addAttributes() {
      return attributes;
    },
    parseHTML() {
      return [{ tag: parseTag }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["span", { ...HTMLAttributes, class: className }, 0];
    },
  });
}

export const SceneHeading = createBlockNode("sceneHeading", {
  dataType: "scene-heading",
  className: "screenplay-element scene-heading",
  attributes: {
    id: { default: null },
    sceneNumber: { default: null },
    synopsis: { default: "" },
    sceneColor: { default: "" },
    adaptationFunction: { default: "" },
    sourceReference: { default: "" },
    turnType: { default: "" },
    conflictGoal: { default: "" },
    exitChange: { default: "" },
  },
  onTab: "action",
});

export const Action = createBlockNode("action", {
  dataType: "action",
  className: "screenplay-element action",
  onTab: "character",
});

export const Character = createBlockNode("character", {
  dataType: "character",
  className: "screenplay-element character",
  attributes: {
    extension: { default: null },
    lang: { default: null },
    dir: { default: null },
  },
  onTab: "parenthetical",
});

export const Parenthetical = createBlockNode("parenthetical", {
  dataType: "parenthetical",
  className: "screenplay-element parenthetical",
  attributes: {
    lang: { default: null },
    dir: { default: null },
  },
  onTab: "dialogue",
});

export const Dialogue = createBlockNode("dialogue", {
  dataType: "dialogue",
  className: "screenplay-element dialogue",
  attributes: {
    lang: { default: null },
    dir: { default: null },
  },
  onTab: "parenthetical",
});

export const Transition = createBlockNode("transition", {
  dataType: "transition",
  className: "screenplay-element transition",
});

export const Shot = createBlockNode("shot", {
  dataType: "shot",
  className: "screenplay-element shot",
});

export const General = createBlockNode("general", {
  dataType: "general",
  className: "screenplay-element general",
});

export const TitlePage = createBlockNode("titlePage", {
  dataType: "title-page",
  className: "screenplay-element title-page",
  attributes: {
    field: { default: "title" },
    tpTitle: { default: "" },
    tpWrittenBy: { default: "" },
    tpBasedOn: { default: "" },
    tpDraft: { default: "" },
    tpDraftDate: { default: "" },
    tpContact: { default: "" },
    tpCopyright: { default: "" },
    tpWgaRegistration: { default: "" },
    tpNotes: { default: "" },
    tpTitleFontSize: { default: 12 },
  },
});

export const NewAct = createBlockNode("newAct", {
  dataType: "new-act",
  className: "screenplay-element new-act",
  attributes: {
    actNumber: { default: null },
    actName: { default: "" },
    customName: { default: "" },
  },
});

export const EndOfAct = createBlockNode("endOfAct", {
  dataType: "end-of-act",
  className: "screenplay-element end-of-act",
  attributes: {
    actNumber: { default: null },
    actName: { default: "" },
  },
});

export const ScriptNoteMark = createInlineMark("scriptNote", {
  parseTag: "span[data-note-id]",
  className: "script-note-highlight",
  attributes: {
    noteId: { default: null },
    color: { default: "#f4d35e" },
  },
});

export const TagMark = createInlineMark("productionTag", {
  parseTag: "span[data-tag-id]",
  className: "production-tag-highlight",
  attributes: {
    tagId: { default: null },
    categoryId: { default: null },
    color: { default: "#9370DB" },
  },
});

export function createPersonalScreenwriterExtensions() {
  return [
    Document,
    Text,
    TextStyle,
    Paragraph,
    History,
    SceneHeading,
    Action,
    Character,
    Parenthetical,
    Dialogue,
    Transition,
    Shot,
    General,
    NewAct,
    EndOfAct,
    TitlePage,
    ScriptNoteMark,
    TagMark,
  ];
}
