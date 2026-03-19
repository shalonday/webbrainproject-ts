import { useCallback, useMemo, useState } from "react";

import { BASE_URL } from "../../common-constants";
import type { Tree, WBNode } from "../../types/types";
import {
  computeMoveForward,
  DEFAULT_START_NODE_ID,
  isMoveForwardEnabled,
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
  isSkillModalOpen: boolean;
  isSkillConfirmed: boolean;
  pathTree: Tree | null;
  resetPath: () => void;
  setIsSkillConfirmed: (value: boolean) => void;
  setIsSkillModalOpen: (value: boolean) => void;
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
  return pathTree.nodes.find((node) => node.uuid === currentNodeId) || null;
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
  const [, setVisitedNodeIds] = useState<string[]>([]);
  const [nodeQueue, setNodeQueue] = useState<string[]>([]);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isSkillConfirmed, setIsSkillConfirmed] = useState(false);

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
    setNodeQueue([]);
  }, []);

  const handleLandOnNode = useCallback((node: WBNode) => {
    if (node.type === "skill" && node.uuid !== DEFAULT_START_NODE_ID) {
      // Open the skill-test tab and show modal for confirmation
      window.open(`/skill-test/${node.uuid}`, "_blank");
      setIsSkillModalOpen(true);
      setIsSkillConfirmed(false);
      return;
    }
    if (node.type === "url") {
      window.open(node.name, "_blank");
      return;
    }
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
        nextPathTree.nodes.length > 0 ? nextPathTree.nodes[0].uuid : null,
      );
      setVisitedNodeIds((prev) =>
        nextPathTree.nodes.length > 0 ? [nextPathTree.nodes[0].uuid] : prev,
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

    const result = computeMoveForward(
      pathTree,
      universalTree,
      currentNodeId,
      doneNodeIds,
      nodeQueue,
    );

    setNodeQueue(result.updatedQueue);

    if (!result.nextNode) {
      return;
    }

    setDoneLinkIds((prev) => [...prev, ...result.newDoneLinkIds]);
    setCurrentNodeId(result.nextNode.uuid);
    setVisitedNodeIds((prev) => [...prev, result.nextNode!.uuid]);
    handleLandOnNode(result.nextNode);
  }, [
    currentNodeId,
    doneNodeIds,
    handleLandOnNode,
    nodeQueue,
    pathTree,
    universalTree,
  ]);

  const isMoveForwardEnabledCb = useCallback(
    () => nodeQueue.length > 0 || isMoveForwardEnabled(pathTree, currentNodeId),
    [currentNodeId, nodeQueue, pathTree],
  );

  return {
    currentNode,
    currentNodeId,
    doneLinkIds,
    doneNodeIds,
    handleGeneratePath,
    handleMoveForward,
    isMoveForwardEnabled: isMoveForwardEnabledCb,
    isSkillConfirmed,
    isSkillModalOpen,
    pathTree,
    resetPath,
    setIsSkillConfirmed,
    setIsSkillModalOpen,
  };
}
