import { useCallback, useMemo, useState } from "react";

import { BASE_URL } from "../../common-constants";
import type { Tree, WBNode } from "../../types/types";
import {
  getLocalProgress,
  saveLocalProgress,
} from "../../utils/progressStorage";
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
  doneLinkTimestamps: Record<string, string>;
  doneNodeIds: string[];
  doneNodeTimestamps: Record<string, string>;
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
 * Reads persisted progress from localStorage and returns initial state
 * for hydrating the hook on mount. Runs once per hook instance.
 */
function hydrateInitialState() {
  const progress = getLocalProgress();
  if (!progress) {
    return {
      doneLinkIds: [] as string[],
      doneLinkTimestamps: {} as Record<string, string>,
      doneNodeIds: [] as string[],
      doneNodeTimestamps: {} as Record<string, string>,
      markedForStudyNodeIds: [] as string[],
    };
  }
  return {
    doneLinkIds: Object.keys(progress.doneLinkTimestamps),
    doneLinkTimestamps: progress.doneLinkTimestamps,
    doneNodeIds: Object.keys(progress.doneNodeTimestamps),
    doneNodeTimestamps: progress.doneNodeTimestamps,
    markedForStudyNodeIds: progress.markedForStudyNodeIds ?? [],
  };
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
  // Hydrate initial done state from localStorage (runs once on mount)
  const [hydrated] = useState(hydrateInitialState);

  const [pathTree, setPathTree] = useState<Tree | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [doneNodeIds, setDoneNodeIds] = useState<string[]>(hydrated.doneNodeIds);
  const [doneLinkIds, setDoneLinkIds] = useState<string[]>(hydrated.doneLinkIds);
  const [doneNodeTimestamps, setDoneNodeTimestamps] = useState<Record<string, string>>(
    hydrated.doneNodeTimestamps,
  );
  const [doneLinkTimestamps, setDoneLinkTimestamps] = useState<Record<string, string>>(
    hydrated.doneLinkTimestamps,
  );
  const [markedForStudyNodeIds] = useState<string[]>(hydrated.markedForStudyNodeIds);
  const [nodeQueue, setNodeQueue] = useState<string[]>([]);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isSkillConfirmed, setIsSkillConfirmed] = useState(false);

  const currentNode = useMemo(
    () => findCurrentNode(pathTree, currentNodeId),
    [currentNodeId, pathTree],
  );

  /**
   * Clears only the active path-navigation session state.
   *
   * We keep persisted progress state (`done*` and study markers) intact so
   * users can regenerate/search paths without losing completion history that
   * was hydrated from localStorage.
   */
  const resetPath = useCallback(() => {
    setPathTree(null);
    setCurrentNodeId(null);
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

    const now = new Date().toISOString();

    // Mark current node as done with timestamp
    const newDoneNodeIds = [...doneNodeIds, currentNodeId];
    const newDoneNodeTimestamps = {
      ...doneNodeTimestamps,
      [currentNodeId]: now,
    };
    setDoneNodeIds(newDoneNodeIds);
    setDoneNodeTimestamps(newDoneNodeTimestamps);

    const result = computeMoveForward(
      pathTree,
      universalTree,
      currentNodeId,
      doneNodeIds,
      nodeQueue,
    );

    setNodeQueue(result.updatedQueue);

    // Update done-link state when a next node exists
    let newDoneLinkTimestamps = doneLinkTimestamps;
    if (result.nextNode) {
      newDoneLinkTimestamps = { ...doneLinkTimestamps };
      for (const linkId of result.newDoneLinkIds) {
        newDoneLinkTimestamps[linkId] = now;
      }
      setDoneLinkIds((prev) => [...prev, ...result.newDoneLinkIds]);
      setDoneLinkTimestamps(newDoneLinkTimestamps);
      setCurrentNodeId(result.nextNode.uuid);
      handleLandOnNode(result.nextNode);
    }

    // Persist updated progress to localStorage
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: now,
      doneNodeTimestamps: newDoneNodeTimestamps,
      doneLinkTimestamps: newDoneLinkTimestamps,
      markedForStudyNodeIds,
    });
  }, [
    currentNodeId,
    doneLinkTimestamps,
    doneNodeIds,
    doneNodeTimestamps,
    handleLandOnNode,
    markedForStudyNodeIds,
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
    doneLinkTimestamps,
    doneNodeIds,
    doneNodeTimestamps,
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
