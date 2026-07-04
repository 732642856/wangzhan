export function createScreenplayDocFromFountain(fountain = "") {
  const text = normalizeNewlines(fountain);
  const lines = text.split("\n");
  const content = [];
  const metadata = extractMetadata(lines);

  if (metadata.title || metadata.author) {
    content.push({
      type: "titlePage",
      attrs: {
        field: "title",
        tpTitle: metadata.title || "",
        tpWrittenBy: metadata.author || "",
        tpBasedOn: "",
        tpDraft: "",
        tpDraftDate: "",
        tpContact: "",
        tpCopyright: "",
        tpWgaRegistration: "",
        tpNotes: "",
        tpTitleFontSize: 12,
      },
      content: metadata.title ? [textNode(metadata.title)] : [],
    });
  }

  let activeCharacter = null;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();

    if (!line) {
      activeCharacter = null;
      continue;
    }

    if (isMetadataLine(line) && content.length <= 1) continue;

    if (isSceneHeading(line)) {
      content.push(node("sceneHeading", line, { id: `scene-${countNodes(content, "sceneHeading") + 1}` }));
      activeCharacter = null;
      continue;
    }

    if (line.startsWith("=") && content.at(-1)?.type === "sceneHeading") {
      const previous = content.at(-1);
      previous.attrs = {
        ...(previous.attrs || {}),
        synopsis: line.replace(/^=\s*/, ""),
      };
      continue;
    }

    if (isTransition(line)) {
      content.push(node("transition", line.replace(/^>\s*/, "")));
      activeCharacter = null;
      continue;
    }

    if (isParenthetical(line) && activeCharacter) {
      content.push(node("parenthetical", line));
      continue;
    }

    if (isCharacterCue(line, lines, index)) {
      activeCharacter = line.replace(/^@/, "").replace(/\s*\^$/, "").trim();
      content.push(node("character", activeCharacter));
      continue;
    }

    if (activeCharacter) {
      content.push(node("dialogue", line));
      continue;
    }

    content.push(node("action", line));
  }

  return normalizeScreenplayDocStructure({
    type: "doc",
    content: content.length ? content : [node("action", "")],
  });
}

export function exportScreenplayDocToFountain(doc) {
  if (typeof doc?.meta?.fountain === "string" && doc.meta.fountain.trim()) {
    return normalizeNewlines(doc.meta.fountain).trim();
  }
  if (!doc?.content?.length) return "";
  const lines = [];

  for (const item of doc.content) {
    if (!item) continue;
    const text = getTextContent(item);

    switch (item.type) {
      case "titlePage": {
        const title = item.attrs?.tpTitle || text;
        const author = item.attrs?.tpWrittenBy || "";
        const basedOn = item.attrs?.tpBasedOn || "";
        const draftDate = item.attrs?.tpDraftDate || item.attrs?.tpDraft || "";
        const contact = item.attrs?.tpContact || "";
        const copyright = item.attrs?.tpCopyright || "";
        if (title) lines.push(`Title: ${title}`);
        if (author) lines.push(`Author: ${author}`);
        if (basedOn) lines.push(`Credit: Based on ${basedOn}`);
        if (draftDate) lines.push(`Draft date: ${draftDate}`);
        if (contact) lines.push(`Contact: ${contact.replace(/\n/g, "\\n")}`);
        if (copyright) lines.push(`Copyright: ${copyright}`);
        if (title || author || basedOn || draftDate || contact || copyright) lines.push("");
        break;
      }
      case "sceneHeading":
        lines.push(text.toUpperCase());
        if (item.attrs?.synopsis) lines.push(`= ${item.attrs.synopsis}`);
        lines.push("");
        break;
      case "action":
        lines.push(text);
        lines.push("");
        break;
      case "character":
        lines.push(text.toUpperCase());
        break;
      case "parenthetical":
        lines.push(text.startsWith("(") ? text : `(${text})`);
        break;
      case "dialogue":
        lines.push(text);
        lines.push("");
        break;
      case "transition":
        lines.push(`> ${text}`);
        lines.push("");
        break;
      case "shot":
      case "newAct":
      case "endOfAct":
      case "general":
        lines.push(text || deriveBlockLabel(item));
        lines.push("");
        break;
      default:
        if (text) {
          lines.push(text);
          lines.push("");
        }
        break;
    }
  }

  return normalizeNewlines(lines.join("\n")).replace(/\n{3,}/g, "\n\n").trim();
}

export function normalizeScreenplayDocStructure(doc) {
  const content = [];
  let nextActNumber = 1;
  let currentOpenActNumber = null;
  let sceneCount = 0;

  for (const item of doc?.content || []) {
    if (!item) continue;

    if (item.type === "newAct") {
      const actNumber = nextActNumber;
      nextActNumber += 1;
      currentOpenActNumber = actNumber;
      content.push({
        ...item,
        attrs: {
          ...(item.attrs || {}),
          actNumber,
          actName: deriveActName(actNumber, item.attrs?.customName),
        },
        content: [{ type: "text", text: deriveActName(actNumber, item.attrs?.customName) }],
      });
      continue;
    }

    if (item.type === "endOfAct") {
      const actNumber = currentOpenActNumber || Math.max(nextActNumber - 1, 1);
      content.push({
        ...item,
        attrs: {
          ...(item.attrs || {}),
          actNumber,
          actName: `END OF ${deriveActName(actNumber, "")}`,
        },
        content: [{ type: "text", text: `END OF ${deriveActName(actNumber, "")}` }],
      });
      currentOpenActNumber = null;
      continue;
    }

    if (item.type === "sceneHeading") {
      sceneCount += 1;
      content.push({
        ...item,
        attrs: {
          ...(item.attrs || {}),
          id: item?.attrs?.id || `scene-${sceneCount}`,
        },
      });
      continue;
    }

    content.push(item);
  }

  return {
    ...(doc || { type: "doc" }),
    type: "doc",
    content: content.length ? content : [node("action", "")],
  };
}

function deriveBlockLabel(item) {
  if (item.type === "newAct") return item.attrs?.customName || item.attrs?.actName || "ACT";
  if (item.type === "endOfAct") return item.attrs?.actName || "END OF ACT";
  return "";
}

function deriveActName(actNumber, customName) {
  return customName || `ACT ${actNumber}`;
}

function extractMetadata(lines) {
  const metadata = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) break;
    const match = line.match(/^([A-Za-z][A-Za-z ]+):\s*(.+)$/);
    if (!match) break;
    metadata[match[1].trim().toLowerCase()] = match[2].trim();
  }
  return {
    title: metadata.title || "",
    author: metadata.author || "",
  };
}

function isMetadataLine(line) {
  return /^([A-Za-z][A-Za-z ]+):\s*(.+)$/.test(line);
}

function node(type, text, attrs = {}) {
  return {
    type,
    attrs,
    content: text ? [textNode(text)] : [],
  };
}

function textNode(text) {
  return {
    type: "text",
    text,
  };
}

function getTextContent(item) {
  return (item?.content || [])
    .filter((child) => child?.type === "text")
    .map((child) => child.text || "")
    .join("");
}

function countNodes(content, type) {
  return content.filter((item) => item?.type === type).length;
}

function normalizeNewlines(text) {
  return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function isSceneHeading(line) {
  return /^(\.|INT\.|EXT\.|EST\.|INT\.\/EXT\.|I\/E\.)/i.test(line);
}

function isTransition(line) {
  return line.startsWith(">") || /^[A-Z\s]+TO:$/.test(line);
}

function isParenthetical(line) {
  return line.startsWith("(") && line.endsWith(")");
}

function isCharacterCue(line, lines, index) {
  const cleaned = line.replace(/^@/, "").replace(/\s*\^$/, "").trim();
  if (index > 0 && lines[index - 1].trim() !== "") return false;
  if (isSceneHeading(cleaned) || isTransition(cleaned)) return false;

  const nextLine = lines[index + 1]?.trim() || "";
  if (!nextLine || nextLine.startsWith("=")) return false;
  if (/[。！？；：,.!?;:]$/.test(cleaned)) return false;

  const isUpper = cleaned.length > 0 && cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);
  const isCjkCue = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(cleaned) && [...cleaned].length <= 16;
  return isUpper || isCjkCue;
}
