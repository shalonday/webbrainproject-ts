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

/**
 * Randomly shuffles an array in-place using the Fisher-Yates algorithm.
 *
 * @param array - The array to shuffle.
 * @returns The same array, shuffled in-place.
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Result of computing the next move-forward step in a learning path.
 */
export interface MoveForwardResult {
  /** The next node to navigate to, or null if no eligible node was found. */
  nextNode: WBNode | null;
  /** Link IDs to newly mark as done for the chosen target node. */
  newDoneLinkIds: string[];
  /** Updated queue after enqueuing new targets and dequeuing the chosen node. */
  updatedQueue: string[];
}

/**
 * Collects outgoing target IDs when the current node is a URL.
 * Returns shuffled skill targets for immediate practice.
 */
function collectUrlOutgoingTargets(
  outgoingLinks: Link[],
  pathTree: Tree,
  currentDoneIds: string[],
  alreadyQueued: Set<string>,
): string[] {
  const targets: string[] = [];
  for (const link of outgoingLinks) {
    const node = pathTree.nodes.find((n) => n.uuid === link.target);
    if (
      node &&
      !nodeIsDone(currentDoneIds, node.uuid) &&
      !alreadyQueued.has(node.uuid)
    ) {
      targets.push(node.uuid);
    }
  }
  return shuffleArray(targets);
}

/**
 * Collects outgoing target IDs when the current node is a skill.
 * Groups each outgoing URL with its child skills for cohesive batching.
 * Mutates alreadyQueued to prevent duplicate entries across the batch.
 */
function collectSkillOutgoingTargets(
  outgoingLinks: Link[],
  pathTree: Tree,
  currentDoneIds: string[],
  alreadyQueued: Set<string>,
): string[] {
  const urlTargetIds: string[] = [];
  for (const link of outgoingLinks) {
    const node = pathTree.nodes.find((n) => n.uuid === link.target);
    if (
      node &&
      !nodeIsDone(currentDoneIds, node.uuid) &&
      !alreadyQueued.has(node.uuid)
    ) {
      urlTargetIds.push(node.uuid);
    }
  }
  shuffleArray(urlTargetIds);

  const targets: string[] = [];
  for (const urlId of urlTargetIds) {
    targets.push(urlId);
    alreadyQueued.add(urlId);

    // Collect the skills taught by this URL and group them after it in the queue.
    const childSkillIds: string[] = [];
    for (const childLink of pathTree.links.filter((l) => l.source === urlId)) {
      const child = pathTree.nodes.find((n) => n.uuid === childLink.target);
      if (
        child &&
        !nodeIsDone(currentDoneIds, child.uuid) &&
        !alreadyQueued.has(child.uuid)
      ) {
        childSkillIds.push(child.uuid);
        alreadyQueued.add(child.uuid);
      }
    }
    targets.push(...shuffleArray(childSkillIds));
  }
  return targets;
}

/**
 * Finds the first node in the queue eligible to visit next.
 * Skips done nodes and URL nodes whose skill prerequisites are incomplete.
 */
function findNextEligibleNode(
  queue: string[],
  pathTree: Tree,
  universalTree: Tree | null,
  currentDoneIds: string[],
): { node: WBNode; index: number } | null {
  for (let i = 0; i < queue.length; i++) {
    const node = pathTree.nodes.find((n) => n.uuid === queue[i]);
    if (!node || nodeIsDone(currentDoneIds, node.uuid)) continue;
    if (
      node.type === "url" &&
      !hasAllSkillPrerequisitesDone(universalTree, node, currentDoneIds)
    ) {
      continue;
    }
    return { node, index: i };
  }
  return null;
}

/**
 * Computes link IDs to mark as done when a target node is chosen.
 * For URL nodes, marks all incoming links. For skill nodes, marks only links from done sources.
 */
function computeNewDoneLinkIds(
  targetNode: WBNode,
  pathTree: Tree,
  currentDoneIds: string[],
): string[] {
  if (targetNode.type === "url") {
    return pathTree.links
      .filter((link) => link.target === targetNode.uuid)
      .map((link) => link.uuid);
  }
  return pathTree.links
    .filter(
      (link) =>
        link.target === targetNode.uuid && currentDoneIds.includes(link.source),
    )
    .map((link) => link.uuid);
}

/**
 * Computes the next node to visit when moving forward in a learning path.
 * Handles BFS queue building with type-based priority and prerequisite gating.
 *
 * When the current node is a URL, its outgoing skills are prepended to the queue front
 * (immediate practice). When the current node is a skill, outgoing URLs are appended
 * to the queue back, each grouped with their child skills.
 * URL nodes are only eligible when all their skill prerequisites are completed.
 *
 * @param pathTree - The tree representing the learning path.
 * @param universalTree - The complete graph for prerequisite checking (null skips checks).
 * @param currentNodeId - The ID of the node being completed.
 * @param doneNodeIds - Already-completed node IDs (excluding currentNodeId).
 * @param nodeQueue - The current queue of pending node IDs.
 * @returns The computed next step: target node, link IDs to mark done, and updated queue.
 */
export function computeMoveForward(
  pathTree: Tree,
  universalTree: Tree | null,
  currentNodeId: string,
  doneNodeIds: string[],
  nodeQueue: string[],
): MoveForwardResult {
  const currentDoneIds = [...doneNodeIds, currentNodeId];
  const currentNode = pathTree.nodes.find((n) => n.uuid === currentNodeId);
  const isCurrentUrl = currentNode?.type === "url";

  const outgoingLinks = pathTree.links.filter(
    (link) => link.source === currentNodeId,
  );
  const alreadyQueued = new Set(nodeQueue);

  const newTargetIds = isCurrentUrl
    ? collectUrlOutgoingTargets(
        outgoingLinks,
        pathTree,
        currentDoneIds,
        alreadyQueued,
      )
    : collectSkillOutgoingTargets(
        outgoingLinks,
        pathTree,
        currentDoneIds,
        alreadyQueued,
      );

  const updatedQueue = isCurrentUrl
    ? [...newTargetIds, ...nodeQueue]
    : [...nodeQueue, ...newTargetIds];

  const next = findNextEligibleNode(
    updatedQueue,
    pathTree,
    universalTree,
    currentDoneIds,
  );
  if (!next) {
    return { nextNode: null, newDoneLinkIds: [], updatedQueue };
  }

  updatedQueue.splice(next.index, 1);

  return {
    nextNode: next.node,
    newDoneLinkIds: computeNewDoneLinkIds(next.node, pathTree, currentDoneIds),
    updatedQueue,
  };
}

/**
 * Walks the path graph from the first node, following edges through
 * already-done nodes, and returns the first undone node that is eligible
 * to visit.  URL nodes are only eligible when all their skill prerequisites
 * are completed.
 *
 * Returns null when every node in the path is already done.
 *
 * @param pathTree - The tree representing the learning path.
 * @param universalTree - The complete graph for prerequisite checking.
 * @param doneNodeIds - Already-completed node IDs.
 * @returns The first undone eligible node, or null.
 */
export function findFirstUndonePathNode(
  pathTree: Tree,
  universalTree: Tree | null,
  doneNodeIds: string[],
): WBNode | null {
  if (pathTree.nodes.length === 0) return null;

  const firstNode = pathTree.nodes.find(
    (n) => n.uuid === DEFAULT_START_NODE_ID,
  );
  if (!firstNode) return null;

  if (!doneNodeIds.includes(firstNode.uuid)) {
    return firstNode;
  }

  // BFS from start through done nodes to find the undone frontier
  const visited = new Set<string>();
  const queue: string[] = [firstNode.uuid];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const outgoingLinks = pathTree.links.filter(
      (link) => link.source === currentId,
    );

    for (const link of outgoingLinks) {
      const targetNode = pathTree.nodes.find((n) => n.uuid === link.target);
      if (!targetNode || visited.has(targetNode.uuid)) continue;

      if (!doneNodeIds.includes(targetNode.uuid)) {
        if (
          targetNode.type === "url" &&
          !hasAllSkillPrerequisitesDone(universalTree, targetNode, doneNodeIds)
        ) {
          continue;
        }
        return targetNode;
      }
      // Target is done — continue BFS through it
      queue.push(targetNode.uuid);
    }
  }

  return null;
}
