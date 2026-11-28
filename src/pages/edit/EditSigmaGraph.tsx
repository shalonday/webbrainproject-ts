import { useEffect, useMemo, useRef } from "react";
import Sigma from "sigma";

import type { Tree } from "../../types/types";
import { createEditSigmaGraph } from "./createEditSigmaGraph";

export interface EditSigmaGraphProps {
  tree: Tree;
  onSkillClick: (nodeId: string) => void;
}

const SIGMA_SETTINGS = {
  defaultEdgeType: "arrow",
  defaultNodeType: "circle",
  autoRescale: true,
  enableCameraPanning: true,
  enableCameraRotation: false,
  enableCameraZooming: true,
  hideEdgesOnMove: false,
  hideLabelsOnMove: false,
  labelDensity: 0.15,
  labelFont: "Arial",
  labelRenderedSizeThreshold: 0,
  labelSize: 14,
  renderEdgeLabels: false,
  renderLabels: true,
  zIndex: true,
} as const;

/**
 * Renders the editable graph and forwards skill clicks.
 *
 * @param props - The analyzed response to visualize.
 * @returns A graph container with its node and link counts.
 */
function EditSigmaGraph({ tree, onSkillClick }: EditSigmaGraphProps) {
  const graph = useMemo(() => createEditSigmaGraph(tree), [tree]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const renderer = new Sigma(graph, container, SIGMA_SETTINGS);
    renderer.on("clickNode", ({ node }) => {
      if (
        tree.nodes.some(
          (candidate) => candidate.uuid === node && candidate.type === "skill",
        )
      ) {
        onSkillClick(node);
      }
    });
    return () => renderer.kill();
  }, [graph, onSkillClick, tree]);

  return (
    <div
      data-link-count={tree.links.length}
      data-node-count={tree.nodes.length}
      data-testid="edit-sigma-graph"
      ref={containerRef}
      style={{ height: "60vh", minHeight: 320, width: "100%" }}
    />
  );
}

export default EditSigmaGraph;
