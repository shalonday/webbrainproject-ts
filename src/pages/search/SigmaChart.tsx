import { useEffect, useMemo, useRef } from "react";
import Sigma from "sigma";

import { MINOR_RADIUS, RADIUS } from "../../common-constants";
import type { WBNode } from "../../types/types";
import type { GraphRendererProps } from "./graph-renderer-types";
import { createSigmaGraph } from "./sigma/createSigmaGraph";

type SigmaChartProps = GraphRendererProps;

const SIGMA_SETTINGS = {
  defaultEdgeType: "arrow",
  defaultNodeType: "circle",
  autoRescale: false,
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
 *
 */
function getNodeDisplayRadius(nodeType: WBNode["type"]): number {
  return nodeType === "skill" ? RADIUS : MINOR_RADIUS;
}

/**
 *
 */
function formatNodeTypeLabel(type: WBNode["type"]): string {
  return type === "url" ? "URL" : "Skill";
}

/**
 *
 */
function SigmaChart({
  tree,
  onNodeClick = () => {},
  pathTree = null,
  selectedNodeIds = [],
  currentNode = null,
  doneNodeIds = [],
  doneLinkIds = [],
  doneNodeTimestamps = {},
  initialFocusNodeId = null,
  markedForStudyNodeIds = [],
}: SigmaChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sigmaGraph = useMemo(
    () =>
      createSigmaGraph({
        currentNode,
        doneLinkIds,
        doneNodeIds,
        doneNodeTimestamps,
        markedForStudyNodeIds,
        pathTree,
        selectedNodeIds,
        tree,
      }),
    [
      currentNode,
      doneLinkIds,
      doneNodeIds,
      doneNodeTimestamps,
      markedForStudyNodeIds,
      pathTree,
      selectedNodeIds,
      tree,
    ],
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const renderer = new Sigma(sigmaGraph, container, SIGMA_SETTINGS);

    renderer.on("clickNode", ({ node }) => {
      onNodeClick(node);
    });

    if (initialFocusNodeId && sigmaGraph.hasNode(initialFocusNodeId)) {
      const focusNode = sigmaGraph.getNodeAttributes(initialFocusNodeId);

      renderer.getCamera().setState({
        angle: 0,
        ratio: 1,
        x: focusNode.x,
        y: focusNode.y,
      });
    }

    return () => {
      renderer.kill();
    };
  }, [initialFocusNodeId, onNodeClick, sigmaGraph]);

  return (
    <div
      style={{
        backgroundColor:
          pathTree && pathTree.nodes?.length ? "#f5f5f5" : "transparent",
        height: "85vh",
        position: "relative",
        width: "100vw",
      }}
    >
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

      <div
        aria-hidden="true"
        data-testid="sigma-observability"
        style={{ display: "none" }}
      >
        <div data-testid="sigma-nodes">
          {sigmaGraph.nodes().map((nodeId) => {
            const node = sigmaGraph.getNodeAttributes(nodeId);
            const doneTimestamp = doneNodeTimestamps[nodeId];

            return (
              <span
                key={nodeId}
                data-current={node.isCurrent ? "true" : "false"}
                data-done={node.isDone ? "true" : "false"}
                data-fill={node.color}
                data-label={
                  doneTimestamp
                    ? `${formatNodeTypeLabel(node.wbType)}: ${node.label}\nCompleted on ${doneTimestamp}`
                    : `${formatNodeTypeLabel(node.wbType)}: ${node.label}`
                }
                data-node-id={nodeId}
                data-node-type={node.wbType}
                data-opacity={node.opacity}
                data-radius={getNodeDisplayRadius(node.wbType)}
                data-study={node.isMarkedForStudy ? "true" : "false"}
              />
            );
          })}
        </div>
        <div data-testid="sigma-edges">
          {sigmaGraph.edges().map((edgeId) => {
            const edge = sigmaGraph.getEdgeAttributes(edgeId);

            return (
              <span
                key={edgeId}
                data-done={edge.isDone ? "true" : "false"}
                data-edge-id={edgeId}
                data-fill={edge.color}
                data-in-path={edge.isInPath ? "true" : "false"}
                data-opacity={edge.opacity}
                data-size={edge.size}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SigmaChart;
