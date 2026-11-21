import type { Attributes } from "graphology-types";

import {
  INACTIVE_LINK_COLOR,
  INACTIVE_MODULE_FILL,
  INACTIVE_SKILL_FILL,
} from "../../common-constants";
import { createSigmaGraph } from "../../graph/createSigmaGraph";
import type { Tree, WBNode } from "../../types/types";

interface EditSigmaNodeAttributes extends Attributes {
  color: string;
  label: string;
  size: number;
  type: string;
  x: number;
  y: number;
}

interface EditSigmaEdgeAttributes extends Attributes {
  color: string;
  size: number;
}

const NODE_LANE_GAP = 1.5;

type NodePosition = { x: number; y: number };

/**
 * Converts an analyzed URL tree into a Sigma graph with prerequisites and
 * objectives placed on opposite sides of the URL.
 *
 * @param tree - The analyzed URL and its prerequisite/objective skills.
 * @returns A Graphology graph ready for the edit-page Sigma renderer.
 */
export function createEditSigmaGraph(tree: Tree) {
  const urlNode = getUrlNode(tree);
  const positions = createNodePositions(tree, urlNode);

  return createSigmaGraph<EditSigmaNodeAttributes, EditSigmaEdgeAttributes>({
    /** @param _link - The analyzed relationship to style. */
    getEdgeAttributes: () => ({ color: INACTIVE_LINK_COLOR, size: 1 }),
    /** @param node - The analyzed URL or skill to position and style. */
    getNodeAttributes: (node) => getEditNodeAttributes(node, positions),
    tree,
  });
}

/**
 * Finds the URL node required to establish the prerequisite/objective lanes.
 *
 * @param tree - The analyzed URL and its related skills.
 * @returns The URL node in the tree.
 */
function getUrlNode(tree: Tree): WBNode {
  const urlNode = tree.nodes.find((node) => node.type === "url");
  if (!urlNode) {
    throw new Error("An edit Sigma graph requires a URL node");
  }

  return urlNode;
}

/**
 * Creates positions for the URL and each prerequisite/objective lane.
 *
 * @param tree - The analyzed URL and its related skills.
 * @param urlNode - The URL node that anchors the layout.
 * @returns Node positions keyed by UUID.
 */
function createNodePositions(
  tree: Tree,
  urlNode: WBNode,
): Map<string, NodePosition> {
  const prerequisiteIds = new Set(
    tree.links
      .filter((link) => link.target === urlNode.uuid)
      .map((link) => link.source),
  );
  const objectiveIds = new Set(
    tree.links
      .filter((link) => link.source === urlNode.uuid)
      .map((link) => link.target),
  );
  const prerequisiteNodes = tree.nodes.filter(
    (node) =>
      node.uuid !== urlNode.uuid &&
      prerequisiteIds.has(node.uuid) &&
      !objectiveIds.has(node.uuid),
  );
  const objectiveNodes = tree.nodes.filter(
    (node) =>
      node.uuid !== urlNode.uuid &&
      objectiveIds.has(node.uuid) &&
      !prerequisiteIds.has(node.uuid),
  );
  const positions = new Map<string, NodePosition>([
    [urlNode.uuid, { x: 0, y: 0 }],
  ]);

  addLanePositions(prerequisiteNodes, -1, positions);
  addLanePositions(objectiveNodes, 1, positions);

  return positions;
}

/**
 * Creates Sigma display attributes for one edit-page node.
 *
 * @param node - The analyzed URL or skill to display.
 * @param positions - Layout positions keyed by node UUID.
 * @returns Sigma rendering attributes for the node.
 */
function getEditNodeAttributes(
  node: WBNode,
  positions: Map<string, NodePosition>,
): EditSigmaNodeAttributes {
  const position = positions.get(node.uuid) ?? { x: 0, y: 0 };

  return {
    color: node.type === "url" ? INACTIVE_MODULE_FILL : INACTIVE_SKILL_FILL,
    label: node.name,
    size: node.type === "url" ? 12 : 10,
    type: "circle",
    x: position.x,
    y: position.y,
  };
}

/**
 * Assigns vertically centered positions to nodes in one horizontal lane.
 *
 * @param nodes - Nodes to place in the lane.
 * @param x - Horizontal coordinate of the lane.
 * @param positions - Position map to update.
 */
function addLanePositions(
  nodes: Tree["nodes"],
  x: number,
  positions: Map<string, NodePosition>,
): void {
  nodes.forEach((node, index) => {
    if (!positions.has(node.uuid)) {
      positions.set(node.uuid, {
        x,
        y: getCenteredLaneY(index, nodes.length),
      });
    }
  });
}

/**
 * Calculates a node's vertical position relative to the center of its lane.
 *
 * @param index - The node's index in its lane.
 * @param nodeCount - The number of nodes in the lane.
 * @returns The vertically centered position for the node.
 */
function getCenteredLaneY(index: number, nodeCount: number): number {
  const midpointIndex = (nodeCount - 1) / 2;
  const offsetFromMidpoint = index - midpointIndex;

  return offsetFromMidpoint * NODE_LANE_GAP;
}
