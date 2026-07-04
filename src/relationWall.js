import React from "react";
import { createRoot } from "react-dom/client";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { buildRelationshipFlow } from "./relationFlow.js";

export function mountRelationshipWall(element, relationships) {
  const flow = buildRelationshipFlow(relationships);
  const root = createRoot(element);
  root.render(React.createElement(RelationshipWall, flow));
  return () => root.unmount();
}

function RelationshipWall({ nodes, edges }) {
  return React.createElement(
    ReactFlow,
    {
      nodes,
      edges,
      fitView: true,
      nodesDraggable: false,
      nodesConnectable: false,
      elementsSelectable: false,
      proOptions: { hideAttribution: true },
    },
    React.createElement(Background),
    React.createElement(Controls, { showInteractive: false }),
  );
}
