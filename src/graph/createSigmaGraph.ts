import { DirectedGraph } from "graphology";
import type { Attributes } from "graphology-types";

import type { Link, Tree, WBNode } from "../types/types";

/**
 * Options for converting a Web Brain tree into a Sigma-compatible graph.
 */
export interface CreateSigmaGraphParams<
  NodeAttributes extends Attributes,
  EdgeAttributes extends Attributes,
> {
  getEdgeAttributes: (link: Link, index: number) => EdgeAttributes;
  getNodeAttributes: (node: WBNode, index: number) => NodeAttributes;
  tree: Tree;
}

/**
 * Builds a directed Graphology graph from a Web Brain tree.
 *
 * @param params - The source tree and callbacks that create Sigma attributes.
 * @returns A Graphology graph keyed by the tree's node and link UUIDs.
 */
export function createSigmaGraph<
  NodeAttributes extends Attributes,
  EdgeAttributes extends Attributes,
>({
  getEdgeAttributes,
  getNodeAttributes,
  tree,
}: CreateSigmaGraphParams<NodeAttributes, EdgeAttributes>): DirectedGraph<
  NodeAttributes,
  EdgeAttributes
> {
  const graph = new DirectedGraph<NodeAttributes, EdgeAttributes>();

  tree.nodes.forEach((node, index) => {
    if (!graph.hasNode(node.uuid)) {
      graph.addNode(node.uuid, getNodeAttributes(node, index));
    }
  });

  tree.links.forEach((link, index) => {
    if (
      graph.hasNode(link.source) &&
      graph.hasNode(link.target) &&
      !graph.hasEdge(link.uuid)
    ) {
      graph.addDirectedEdgeWithKey(
        link.uuid,
        link.source,
        link.target,
        getEdgeAttributes(link, index),
      );
    }
  });

  return graph;
}
