import type { Tree, WBNode } from "../../../types/types";
import {
  getLinkColor,
  getLinkOpacity,
  getNodeFill,
  getNodeOpacity,
  isLinkDone,
  isLinkInPath,
} from "../graph-styles";

/**
 * Sigma node attributes used by rendering and tests.
 */
export interface SigmaNodeAttributes {
  color: string; // Sigma/Graphology: node fill color used by the renderer.
  doneTimestamp?: string; // Project-specific: ISO timestamp when the user completed this node. Used for history/labels.
  isCurrent: boolean; // Project-specific: whether this node is the current focus in the learning path.
  isDone: boolean; // Project-specific: whether the user marked this node as completed.
  isMarkedForStudy: boolean; // Project-specific: whether the node is flagged for later study.
  isSelected: boolean; // Project-specific: UI selection state (not a Sigma built-in).
  label: string; // Sigma/Graphology: displayed label for the node.
  opacity: number; // Project-specific: per-node opacity computed from path/gating rules.
  size: number; // Sigma/Graphology: visual size (radius) used by the renderer.
  type: string; // Sigma/Graphology: rendering program key (e.g. "circle").
  wbType: WBNode["type"]; // Project-specific: original WB node domain type (e.g. "skill" | "url").
  x: number; // Sigma/Graphology: x coordinate in graph space.
  y: number; // Sigma/Graphology: y coordinate in graph space.
}

/**
 * Sigma edge attributes used by rendering and tests.
 */
export interface SigmaEdgeAttributes {
  color: string; // Sigma/Graphology: edge color used by the renderer.
  isDone: boolean; // Project-specific: whether this link is considered completed by the user.
  isInPath: boolean; // Project-specific: whether this link is part of the currently generated path.
  opacity: number; // Project-specific: per-edge opacity computed from path/gating rules.
  size: number; // Sigma/Graphology: visual thickness of the edge.
}

/**
 * Rendering state needed to derive Sigma node attributes.
 */
export interface SigmaNodeState {
  currentNode?: WBNode | null;
  doneNodeIds?: string[];
  doneNodeTimestamps?: Record<string, string>;
  markedForStudyNodeIds?: string[];
  pathTree?: Tree | null;
  selectedNodeIds?: string[];
}

/**
 * Rendering state needed to derive Sigma edge attributes.
 */
export interface SigmaEdgeState {
  doneLinkIds?: string[];
  pathTree?: Tree | null;
}

/**
 * Maps node + state into Sigma attributes without mutating selection semantics.
 */
export function getSigmaNodeAttributes(
  node: WBNode,
  position: { x: number; y: number },
  state: SigmaNodeState,
): SigmaNodeAttributes {
  const selectedNodeIds = state.selectedNodeIds ?? [];
  const doneNodeIds = state.doneNodeIds ?? [];
  const markedForStudyNodeIds = state.markedForStudyNodeIds ?? [];
  const doneNodeTimestamps = state.doneNodeTimestamps ?? {};

  return {
    color: getNodeFill(
      node,
      selectedNodeIds,
      doneNodeIds,
      markedForStudyNodeIds,
    ),
    doneTimestamp: doneNodeTimestamps[node.uuid],
    isCurrent: Boolean(state.currentNode?.uuid === node.uuid),
    isDone: doneNodeIds.includes(node.uuid),
    isMarkedForStudy: markedForStudyNodeIds.includes(node.uuid),
    isSelected: selectedNodeIds.includes(node.uuid),
    label: node.name,
    opacity: getNodeOpacity(node, state.pathTree ?? null),
    size: node.type === "skill" ? 10 : 12,
    // `type` here is the Sigma program key. Use the default circle program.
    type: "circle",
    // Preserve domain type separately to avoid confusing Sigma's `type` program key.
    wbType: node.type,
    x: position.x,
    y: position.y,
  };
}

/**
 * Maps edge + state into Sigma attributes without mutating path semantics.
 */
export function getSigmaEdgeAttributes(
  link: { source: string; target: string; uuid: string },
  state: SigmaEdgeState,
): SigmaEdgeAttributes {
  const doneLinkIds = state.doneLinkIds ?? [];
  const pathTree = state.pathTree ?? null;

  return {
    color: getLinkColor(link, pathTree, doneLinkIds),
    isDone: isLinkDone(link, doneLinkIds),
    isInPath: isLinkInPath(link, pathTree),
    opacity: getLinkOpacity(link, pathTree),
    size: 2,
  };
}
