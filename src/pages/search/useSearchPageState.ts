import type React from "react";
import { useCallback, useMemo, useState } from "react";

import { useSkillTreesContext } from "../../contexts/SkillTreesContext";
import type { Tree, WBNode } from "../../types/types";
import { searchNodes } from "./search-utils";
import { useLearningPathNavigator } from "./useLearningPathNavigator";

interface UseSearchPageStateResult {
  currentNode: WBNode | null;
  currentNodeId: string | null;
  doneLinkIds: string[];
  doneNodeIds: string[];
  handleGeneratePath: () => Promise<void>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  handleMoveForward: () => void;
  handleResultSelect: (nodeId: string) => void;
  handleSearch: (term: string) => void;
  highlightedNodeIds: string[];
  isLoadingQuery: boolean;
  isMoveForwardEnabled: () => boolean;
  isSearchActive: boolean;
  isSkillConfirmed: boolean;
  isSkillModalOpen: boolean;
  pathTree: Tree | null;
  recommendedNodes: WBNode[];
  searchResults: WBNode[];
  searchTerm: string;
  selectedResultId: string | null;
  setIsSkillConfirmed: (value: boolean) => void;
  setIsSkillModalOpen: (value: boolean) => void;
  setSearchTerm: (value: string) => void;
  universalTree: Tree | null;
}

/**
 * Hook for managing the search page state and orchestrating search, path generation, and navigation.
 * Wires together the skill trees context and learning path navigator.
 * Provides search functionality with local filtering and manages the search/path UI state.
 *
 * @returns Search page state including search results, path data, and event handlers.
 */
export function useSearchPageState(): UseSearchPageStateResult {
  const { universalTree, isLoadingQuery } = useSkillTreesContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<WBNode[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const recommendedNodes = useMemo(
    () => universalTree?.nodes.slice(0, 5) || [],
    [universalTree],
  );

  const {
    pathTree,
    currentNode,
    currentNodeId,
    doneNodeIds,
    doneLinkIds,
    handleGeneratePath,
    handleMoveForward,
    isMoveForwardEnabled,
    isSkillConfirmed,
    isSkillModalOpen,
    resetPath,
    setIsSkillConfirmed,
    setIsSkillModalOpen,
  } = useLearningPathNavigator({
    universalTree: universalTree ?? null,
    selectedResultId,
  });

  const highlightedNodeIds = useMemo(
    () => searchResults.map((node) => node.uuid),
    [searchResults],
  );

  const handleSearch = useCallback(
    (term: string) => {
      if (!universalTree || !term.trim()) {
        setSearchResults([]);
        setIsSearchActive(false);
        return;
      }
      const results = searchNodes(term, universalTree);
      setSearchResults(results);
      setIsSearchActive(true);
      setSelectedResultId(null);
      resetPath();
    },
    [resetPath, universalTree],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleSearch(searchTerm);
      }
    },
    [handleSearch, searchTerm],
  );

  const handleResultSelect = useCallback(
    (nodeId: string) => {
      setSelectedResultId(nodeId);
      resetPath();
    },
    [resetPath],
  );

  return {
    currentNode,
    currentNodeId,
    doneLinkIds,
    doneNodeIds,
    handleGeneratePath,
    handleKeyDown,
    handleMoveForward,
    handleResultSelect,
    handleSearch,
    highlightedNodeIds,
    isLoadingQuery,
    isMoveForwardEnabled,
    isSearchActive,
    isSkillConfirmed,
    isSkillModalOpen,
    pathTree,
    recommendedNodes,
    searchResults,
    searchTerm,
    selectedResultId,
    setIsSkillConfirmed,
    setIsSkillModalOpen,
    setSearchTerm,
    universalTree: universalTree ?? null,
  };
}
