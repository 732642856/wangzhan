export function extractSceneNavigation(doc) {
  const entries = [];
  let currentActNumber = null;

  for (const node of doc?.content || []) {
    if (!node) continue;
    if (node.type === "newAct") {
      currentActNumber = Number(node?.attrs?.actNumber || entries.filter((entry) => entry.actLabel).length + 1);
      continue;
    }
    if (node.type === "endOfAct") {
      currentActNumber = null;
      continue;
    }
    if (node.type !== "sceneHeading") continue;

    entries.push({
      id: node?.attrs?.id || `scene-${entries.length + 1}`,
      title: getNodeText(node).trim(),
      index: entries.length + 1,
      actLabel: currentActNumber ? `A${currentActNumber}` : "",
      synopsis: node?.attrs?.synopsis || "",
      location: extractLocation(getNodeText(node)),
      time: extractSceneTime(getNodeText(node)),
      adaptationFunction: node?.attrs?.adaptationFunction || "",
      sourceReference: node?.attrs?.sourceReference || "",
      turnType: node?.attrs?.turnType || "",
      conflictGoal: node?.attrs?.conflictGoal || "",
      exitChange: node?.attrs?.exitChange || "",
    });
  }

  return entries;
}

function getNodeText(node) {
  return (node?.content || [])
    .filter((item) => item?.type === "text")
    .map((item) => item.text || "")
    .join("");
}

function extractLocation(heading) {
  return String(heading || "")
    .replace(/^(INT\.|EXT\.|EST\.|INT\.\/EXT\.|I\/E\.)\s*/i, "")
    .split(/\s+-\s+/)[0]
    ?.trim() || "";
}

function extractSceneTime(heading) {
  const parts = String(heading || "").split(/\s+-\s+/);
  return parts.length > 1 ? parts.at(-1).trim() : "";
}
