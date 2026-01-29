import { useCallback, useMemo, useState } from "react";

import { BASE_URL } from "../../common-constants";
import type { Link, Tree, WBNode } from "../../types/types";
import {
  DEFAULT_START_NODE_ID,
  findUndoneBranchTarget,
  hasAllSkillPrerequisitesDone,
  isMoveForwardEnabled,
  nodeIsDone,
} from "./search-utils";

interface UseLearningPathNavigatorParams {
  selectedResultId: string | null;
  universalTree: Tree | null;
}

interface UseLearningPathNavigatorResult {
  currentNode: WBNode | null;
  currentNodeId: string | null;
  doneLinkIds: string[];
  doneNodeIds: string[];
  handleGeneratePath: () => Promise<void>;
  handleMoveForward: () => void;
  isMoveForwardEnabled: () => boolean;
  pathTree: Tree | null;
  resetPath: () => void;
}

/**
 * Finds and returns the current node in the path tree by ID.
 *
 * @param pathTree - The tree structure representing the learning path.
 * @param currentNodeId - The ID of the current node.
 * @returns The current node object, or null if not found.
 */
function findCurrentNode(pathTree: Tree | null, currentNodeId: string | null) {
  if (!pathTree || !currentNodeId) return null;
  return pathTree.nodes.find((node) => node.id === currentNodeId) || null;
}

/**
 * Hook for managing learning path generation and navigation state.
 * Handles path fetching, node traversal, prerequisite checking, and backtracking.
 *
 * @param params - Hook parameters.
 * @param params.universalTree - The complete graph of all nodes and links.
 * @param params.selectedResultId - The ID of the selected target node.
 * @returns Learning path state and navigation handlers.
 */
export function useLearningPathNavigator({
  universalTree,
  selectedResultId,
}: UseLearningPathNavigatorParams): UseLearningPathNavigatorResult {
  const [pathTree, setPathTree] = useState<Tree | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [doneNodeIds, setDoneNodeIds] = useState<string[]>([]);
  const [doneLinkIds, setDoneLinkIds] = useState<string[]>([]);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);

  const currentNode = useMemo(
    () => findCurrentNode(pathTree, currentNodeId),
    [currentNodeId, pathTree],
  );

  const resetPath = useCallback(() => {
    setPathTree(null);
    setCurrentNodeId(null);
    setDoneNodeIds([]);
    setDoneLinkIds([]);
    setVisitedNodeIds([]);
  }, []);

  const handleLandOnNode = useCallback((node: WBNode) => {
    if (node.type === "skill") {
      // eslint-disable-next-line no-console
      console.log("Landed on skill node:", node);
      return;
    }
    if (node.type === "url") {
      // eslint-disable-next-line no-console
      console.log("Landed on URL node:", node);
      return;
    }
    // eslint-disable-next-line no-console
    console.log("Landed on node:", node);
  }, []);

  const handleGeneratePath = useCallback(async () => {
    if (!selectedResultId) return;

    resetPath();

    try {
      const response = await fetch(
        `${BASE_URL}/paths/${DEFAULT_START_NODE_ID}/${selectedResultId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch path: ${response.statusText}`);
      }

      const data = await response.json();
      const nextPathTree: Tree = { nodes: data.nodes, links: data.links };
      setPathTree(nextPathTree);
      setCurrentNodeId(
        nextPathTree.nodes.length > 0 ? nextPathTree.nodes[0].id : null,
      );
      setVisitedNodeIds((prev) =>
        nextPathTree.nodes.length > 0 ? [nextPathTree.nodes[0].id] : prev,
      );

      if (nextPathTree.nodes.length > 0) {
        handleLandOnNode(nextPathTree.nodes[0]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating path:", error);
      resetPath();
    }
  }, [handleLandOnNode, resetPath, selectedResultId]);

  const handleMoveForward = useCallback(() => {
    if (!pathTree || !currentNodeId) {
      return;
    }

    setDoneNodeIds((prev) => [...prev, currentNodeId]);

    const outgoingLinks = pathTree.links.filter(
      (link) => link.source === currentNodeId,
    );
    if (outgoingLinks.length === 0) return;

    let targetLink: Link | null = null;
    let targetNode: WBNode | null = null;

    for (const link of outgoingLinks) {
      const node = pathTree.nodes.find((n) => n.id === link.target);
      if (node && !nodeIsDone(doneNodeIds, node.id)) {
        if (
          node.type === "url" &&
          !hasAllSkillPrerequisitesDone(universalTree, node, doneNodeIds, [
            currentNodeId,
          ])
        ) {
          continue;
        }
        targetLink = link;
        targetNode = node;
        break;
      }
    }

    if (!targetNode) {
      const backtrackTarget = findUndoneBranchTarget(
        pathTree,
        visitedNodeIds,
        doneNodeIds,
      );
      if (backtrackTarget) {
        targetNode = backtrackTarget.node;
        targetLink = backtrackTarget.link;
      } else {
        return;
      }
    }

    if (targetLink) {
      if (targetNode.type === "url") {
        const allIncomingLinks = pathTree.links.filter(
          (link) => link.target === targetNode?.id,
        );
        const incomingLinkIds = allIncomingLinks.map((link) => link.id);
        setDoneLinkIds((prev) => [...prev, ...incomingLinkIds]);
      } else {
        setDoneLinkIds((prev) => [...prev, targetLink.id]);
      }
    }

    setCurrentNodeId(targetNode.id);
    setVisitedNodeIds((prev) => [...prev, targetNode?.id]);
    handleLandOnNode(targetNode);
  }, [
    currentNodeId,
    doneNodeIds,
    handleLandOnNode,
    pathTree,
    universalTree,
    visitedNodeIds,
  ]);

  const isMoveForwardEnabledCb = useCallback(
    () => isMoveForwardEnabled(pathTree, currentNodeId),
    [currentNodeId, pathTree],
  );

  return {
    currentNode,
    currentNodeId,
    doneLinkIds,
    doneNodeIds,
    handleGeneratePath,
    handleMoveForward,
    isMoveForwardEnabled: isMoveForwardEnabledCb,
    pathTree,
    resetPath,
  };
}
