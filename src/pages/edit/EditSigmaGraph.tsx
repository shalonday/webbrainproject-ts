import { useEffect, useMemo, useRef } from "react";
import { Sigma } from "sigma";

import type { AnalyzeResponse } from "../../types/types";
import { createAnalyzeResponseTree } from "./createAnalyzeResponseTree";
import { createEditSigmaGraph } from "./createEditSigmaGraph";

export interface EditSigmaGraphProps {
  analyzeResponse: AnalyzeResponse;
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
  renderLabels: false,
  zIndex: true,
} as const;

/**
 * Prepares the analyzed graph tree for the edit-page renderer.
 *
 * @param props - The analyzed response to visualize.
 * @returns A graph container with its node and link counts.
 */
function EditSigmaGraph({ analyzeResponse }: EditSigmaGraphProps) {
  const tree = useMemo(
    () => createAnalyzeResponseTree(analyzeResponse),
    [analyzeResponse],
  );
  const graph = useMemo(() => createEditSigmaGraph(tree), [tree]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const renderer = new Sigma(graph, container, SIGMA_SETTINGS);
    return () => renderer.kill();
  }, [graph]);

  return (
    <div
      data-link-count={tree.links.length}
      data-node-count={tree.nodes.length}
      data-testid="edit-sigma-graph"
      ref={containerRef}
      style={{ height: "100%", width: "100%" }}
    />
  );
}

export default EditSigmaGraph;
