import { DirectedGraph } from "graphology";

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
export interface CreateSigmaGraphParams {
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
 * Builds a deterministic directed graph keyed by WB node/link UUIDs.
 */
export function createSigmaGraph(
  params: CreateSigmaGraphParams,
): DirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes> {
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

  const graph = new DirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes>();

  // TODO(sigma-scale): Keep the UUID sort for now because it gives stable graph
  // exports and deterministic seed positions during the D3 -> Sigma parity work.
  // Revisit this when tree creation cost becomes measurable at larger scales:
  // current complexity is O(n log n) time plus O(n) array copies for nodes/links.
  // A follow-up refactor should preserve deterministic positions without a global
  // sort, likely by deriving coordinates from a stable UUID hash or by caching
  // deterministic positions/graph state across renders. If this changes, keep the
  // adapter tests focused on deterministic output and validate that initial focus
  // and camera-follow behavior still feel correct with the new position strategy.
  const sortedNodes = [...tree.nodes].sort((a, b) =>
    a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0,
  );
  const sortedLinks = [...tree.links].sort((a, b) =>
    a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0,
  );

  const layoutPositions = buildDeterministicForceLayoutPositions(sortedNodes);

  for (const [, node] of sortedNodes.entries()) {
    if (graph.hasNode(node.uuid)) {
      continue;
    }

    const position = layoutPositions[node.uuid];

    graph.addNode(
      node.uuid,
      getSigmaNodeAttributes(node, position, {
        currentNode,
        doneNodeIds,
        doneNodeTimestamps,
        markedForStudyNodeIds,
        pathTree,
        selectedNodeIds,
      }),
    );
  }

  for (const link of sortedLinks) {
    if (!graph.hasNode(link.source) || !graph.hasNode(link.target)) {
      continue;
    }

    if (graph.hasEdge(link.uuid)) {
      continue;
    }

    graph.addDirectedEdgeWithKey(
      link.uuid,
      link.source,
      link.target,
      getSigmaEdgeAttributes(link, {
        doneLinkIds,
        pathTree,
      }),
    );
  }

  return graph;
}
