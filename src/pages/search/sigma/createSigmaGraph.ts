import { createSigmaGraph as createGraphologySigmaGraph } from "../../../graph/createSigmaGraph";
import type { Tree, WBNode } from "../../../types/types";
import {
  getSigmaEdgeAttributes,
  getSigmaNodeAttributes,
  type SigmaEdgeAttributes,
  type SigmaNodeAttributes,
} from "./sigma-attributes";
import { buildDeterministicForceLayoutPositions } from "./sigma-force-layout.ts";

/**
 * Input contract for converting WB tree data into a Graphology graph for Sigma.
 */
export interface CreateSearchSigmaGraphParams {
  currentNode?: WBNode | null;
  doneLinkIds?: string[];
  doneNodeIds?: string[];
  doneNodeTimestamps?: Record<string, string>;
  markedForStudyNodeIds?: string[];
  pathTree?: Tree | null;
  selectedNodeIds?: string[];
  tree: Tree;
}

/**
 * Builds a deterministic, styled graph for the search page.
 *
 * @param params - Search graph data and progress state.
 * @returns A directed Graphology graph keyed by WB node and link UUIDs.
 */
export function createSearchSigmaGraph(
  params: CreateSearchSigmaGraphParams,
): import("graphology").DirectedGraph<
  SigmaNodeAttributes,
  SigmaEdgeAttributes
> {
  const {
    currentNode = null,
    doneLinkIds = [],
    doneNodeIds = [],
    doneNodeTimestamps = {},
    markedForStudyNodeIds = [],
    pathTree = null,
    selectedNodeIds = [],
    tree,
  } = params;

  // Stable ordering keeps graph exports and layout positions deterministic.
  const sortedNodes = [...tree.nodes].sort((a, b) =>
    a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0,
  );
  const sortedLinks = [...tree.links].sort((a, b) =>
    a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0,
  );
  const layoutPositions = buildDeterministicForceLayoutPositions(sortedNodes);

  return createGraphologySigmaGraph({
    /** @param link - The relationship to style for the search graph. */
    getEdgeAttributes: (link) =>
      getSigmaEdgeAttributes(link, { doneLinkIds, pathTree }),
    /** @param node - The node to position and style for the search graph. */
    getNodeAttributes: (node) =>
      getSigmaNodeAttributes(node, layoutPositions[node.uuid], {
        currentNode,
        doneNodeIds,
        doneNodeTimestamps,
        markedForStudyNodeIds,
        pathTree,
        selectedNodeIds,
      }),
    tree: { links: sortedLinks, nodes: sortedNodes },
  });
}
