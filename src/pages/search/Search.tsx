import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Tooltip,
} from "@mui/material";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { createPerkAPIClient } from "../../api/perkClient";
import { ExportButton } from "../../components/progress/ExportButton";
import { ImportDialog } from "../../components/progress/ImportDialog";
import { RAGChatbot } from "../../components/RAGChatbot";
import type { WBNode } from "../../types/types";
import { BottomSheet } from "./components/BottomSheet";
import { SkillModal } from "./components/SkillModal";
import { DEFAULT_START_NODE_ID } from "./search-utils";
import SearchPageChart from "./SearchPageChart";
import { useSearchPageState } from "./useSearchPageState";

/**
 * Search page component that allows users to search through the universal tree of skills and URLs.
 * Fetches data on mount and provides a search interface with path generation capability.
 *
 * @returns {ReactNode} The rendered search page.
 */
function Search(): ReactNode {
  const { endId } = useParams<{ startId?: string; endId?: string }>();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const apiClient = useMemo(() => createPerkAPIClient(), []);
  const {
    currentNode,
    currentNodeId,
    doneLinkIds,
    doneNodeIds,
    doneNodeTimestamps,
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
    markedForStudyNodeIds,
    pathTree,
    refreshFromStorage,
    recommendedNodes,
    searchResults,
    searchTerm,
    selectedResultId,
    setIsSkillConfirmed,
    setIsSkillModalOpen,
    setSearchTerm,
    universalTree,
  } = useSearchPageState();

  // Auto-generate path from URL params
  useEffect(() => {
    if (endId && !pathTree) {
      // Simulate selecting the result and generating path
      handleResultSelect(endId);
      // Wait for next tick to ensure selectedResultId is set
      setTimeout(() => {
        handleGeneratePath();
      }, 0);
    }
  }, [endId, handleGeneratePath, handleResultSelect, pathTree]);

  /**
   * Handles closing the skill modal without confirmation and allowing progress.
   *
   * @todo Future enhancement: Add skip mastery flow
   * - Add second radio button option: "Skip testing on this skill"
   * - Display warning message when user selects skip option
   * - Track skipped nodes separately in progress state (distinct from completed nodes)
   * - Render skipped nodes in different color (e.g., amber/yellow) vs completed (green)
   */
  const handleCloseSkillModal = () => {
    setIsSkillModalOpen(false);
    // Allow Move Forward to proceed even without confirmation
    setIsSkillConfirmed(true);
  };

  /**
   * Handles clicking on a path node.
   * Currently logs the node properties as a placeholder.
   *
   * @param {WBNode} node - The node that was clicked.
   */
  const handlePathNodeClick = (node: WBNode) => {
    // eslint-disable-next-line no-console
    console.log("Path node clicked:", node);
  };

  /**
   * Handles search term changes.
   * Clears search when term is empty.
   *
   * @param value - The new search term.
   */
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      handleSearch("");
    }
  };

  if (isLoadingQuery) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress role="progressbar" />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <Tooltip title="Open chatbot">
        <Fab
          aria-label="Open chatbot"
          color="primary"
          onClick={() => setIsChatbotOpen(true)}
          sx={{
            position: "absolute",
            top: 24,
            right: 24,
            zIndex: 1100,
          }}
        >
          <ChatBubbleOutlineIcon />
        </Fab>
      </Tooltip>

      {/* Progress Controls */}
      <Box
        sx={{
          position: "absolute",
          top: 92,
          right: 24,
          zIndex: 1100,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <ExportButton />
        <ImportDialog
          isPathActive={Boolean(pathTree?.nodes?.length)}
          onImportSuccess={refreshFromStorage}
        />
      </Box>

      {/* Background Chart */}
      {universalTree && (
        <SearchPageChart
          currentNode={currentNode}
          doneLinkIds={doneLinkIds}
          doneNodeIds={doneNodeIds}
          doneNodeTimestamps={doneNodeTimestamps}
          highlightedNodeIds={highlightedNodeIds}
          markedForStudyNodeIds={markedForStudyNodeIds}
          pathTree={pathTree}
          universalTree={universalTree}
        />
      )}

      {/* Foreground Waze-style Bottom Sheet */}
      <BottomSheet
        currentNodeId={currentNodeId}
        doneNodeIds={doneNodeIds}
        isMoveForwardEnabled={
          currentNode?.type === "skill" &&
          currentNode.uuid !== DEFAULT_START_NODE_ID &&
          !isSkillConfirmed
            ? false
            : isMoveForwardEnabled()
        }
        isSearchActive={isSearchActive}
        onGeneratePath={handleGeneratePath}
        onKeyDown={handleKeyDown}
        onMoveForward={handleMoveForward}
        onPathNodeClick={handlePathNodeClick}
        onResultSelect={handleResultSelect}
        onSearchChange={handleSearchChange}
        pathTree={pathTree}
        recommendedNodes={recommendedNodes}
        searchResults={searchResults}
        searchTerm={searchTerm}
        selectedResultId={selectedResultId}
      />

      <Dialog
        open={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          Web Brain Project Chatbot
          <IconButton
            aria-label="Close chatbot"
            onClick={() => setIsChatbotOpen(false)}
            sx={{ marginLeft: "auto" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: 0, height: "80vh" }}>
          <RAGChatbot
            apiClient={apiClient}
            startNodeId={DEFAULT_START_NODE_ID}
            sx={{ height: "100%" }}
          />
        </DialogContent>
      </Dialog>

      <SkillModal
        isOpen={isSkillModalOpen}
        skillName={currentNode?.name}
        onClose={handleCloseSkillModal}
        onConfirm={() => setIsSkillConfirmed(true)}
        isConfirmed={isSkillConfirmed}
      />
    </Box>
  );
}

export default Search;
