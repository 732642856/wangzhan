export function buildRelationshipFlow(relationships) {
  const nodes = (relationships.nodes || []).map((node, index) => ({
    id: node.id,
    data: { label: node.label },
    position: {
      x: node.type === "scene" ? 220 : 0,
      y: (node.type === "scene" ? index - characterCountBefore(relationships.nodes, index) : index) * 82,
    },
    type: "default",
  }));
  const edges = (relationships.edges || []).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: false,
  }));
  return { nodes, edges };
}

function characterCountBefore(nodes, index) {
  return nodes.slice(0, index).filter((node) => node.type === "character").length;
}
