import type { Link, Tree, WBNode } from "../../types/types";

/**
 * Hardcoded start node ID for path generation.
 * TODO: Make configurable via user settings or context.
 */
export const DEFAULT_START_NODE_ID = "97838643-4e9b-434f-8985-89dd23408647";

/**
 * Checks if a node matches the search query.
 * Performs case-insensitive substring matching on the node name.
 *
 * @param node - The node to check.
 * @param query - The search query string.
 * @returns True if the node name contains the query string.
 */
export function nodeIsMatch(node: WBNode, query: string): boolean {
  return node.name?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

/**
 * Searches for nodes in the tree that match the given query.
 * Filters nodes using case-insensitive substring matching.
 *
 * @param query - The search query string.
 * @param tree - The tree structure to search within.
 * @returns Array of nodes matching the query.
 */
export function searchNodes(query: string, tree: Tree): WBNode[] {
  return tree.nodes.filter((node) => nodeIsMatch(node, query));
}

/**
 * Checks if a node has been marked as completed.
 *
 * @param doneNodeIds - Array of completed node IDs.
 * @param nodeId - The node ID to check.
 * @returns True if the node is marked as done.
 */
export function nodeIsDone(
  doneNodeIds: string[],
  nodeId: string | undefined,
): boolean {
  if (!nodeId) return false;
  return doneNodeIds.includes(nodeId);
}

/**
 * Checks if all skill prerequisites for a URL node have been completed.
 * Looks at the universal tree to find all skill nodes that link to this URL.
 *
 * @param universalTree - The complete graph of all nodes and links.
 * @param urlNode - The URL node to check prerequisites for.
 * @param doneNodeIds - Array of completed node IDs.
 * @param additionalDoneIds - Optional additional node IDs to consider as done.
 * @returns True if all skill prerequisites are completed.
 */
export function hasAllSkillPrerequisitesDone(
  universalTree: Tree | null,
  urlNode: WBNode,
  doneNodeIds: string[],
  additionalDoneIds: string[] = [],
): boolean {
  if (!universalTree || urlNode.type !== "url") return true;

  const prerequisiteNodeIds = universalTree.links
    .filter((link) => link.target === urlNode.uuid)
    .map((link) => link.source);

  const prerequisiteNodes = universalTree.nodes.filter((node) =>
    prerequisiteNodeIds.includes(node.uuid),
  );

  const skillPrerequisites = prerequisiteNodes.filter(
    (node) => node.type === "skill",
  );
  const allDoneIds = [...doneNodeIds, ...additionalDoneIds];
  return skillPrerequisites.every((node) => allDoneIds.includes(node.uuid));
}

/**
 * Finds an undone target node from a previously visited branching point.
 * Used for backtracking when the current path forward is blocked.
 *
 * @param pathTree - The tree structure representing the learning path.
 * @param visitedNodeIds - Array of node IDs that have been visited.
 * @param doneNodeIds - Array of completed node IDs.
 * @returns An object containing the undone node and link, or null if none found.
 */
export function findUndoneBranchTarget(
  pathTree: Tree | null,
  visitedNodeIds: string[],
  doneNodeIds: string[],
): { node: WBNode; link: Link } | null {
  if (!pathTree) return null;

  for (const visitedId of visitedNodeIds) {
    const outgoingLinks = pathTree.links.filter(
      (link) => link.source === visitedId,
    );

    if (outgoingLinks.length <= 1) continue;

    for (const link of outgoingLinks) {
      const node = pathTree.nodes.find((n) => n.uuid === link.target);
      if (node && !nodeIsDone(doneNodeIds, node.uuid)) {
        return { node, link };
      }
    }
  }

  return null;
}

/**
 * Determines if the Move Forward action is enabled.
 * Enabled when there are outgoing links from the current node.
 *
 * @param pathTree - The tree structure representing the learning path.
 * @param currentNodeId - The ID of the current node.
 * @returns True if forward movement is possible.
 */
export function isMoveForwardEnabled(
  pathTree: Tree | null,
  currentNodeId: string | null,
): boolean {
  if (!pathTree || !currentNodeId) return false;
  const outgoingLinks = pathTree.links.filter(
    (link) => link.source === currentNodeId,
  );
  return outgoingLinks.length > 0;
}
