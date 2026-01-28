import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Tooltip,
} from "@mui/material";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { createPerkAPIClient, RAGChatbot } from "wbp-chatbot";

import type { WBNode } from "../../types/types";
import { ActionButtons } from "./components/ActionButtons";
import { PathList } from "./components/PathList";
import { RecommendedList } from "./components/RecommendedList";
import { ResultsList } from "./components/ResultsList";
import { SearchInput } from "./components/SearchInput";
import SearchPageChart from "./SearchPageChart";
import { useSearchPageState } from "./useSearchPageState";

/**
 * Search page component that allows users to search through the universal tree of skills and URLs.
 * Fetches data on mount and provides a search interface with path generation capability.
 *
 * @returns {ReactNode} The rendered search page.
 */
function Search(): ReactNode {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const apiClient = useMemo(() => createPerkAPIClient(), []);
  const {
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
    pathTree,
    recommendedNodes,
    searchResults,
    searchTerm,
    selectedResultId,
    setSearchTerm,
    universalTree,
  } = useSearchPageState();

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

      {/* Background Chart */}
      {universalTree && (
        <SearchPageChart
          currentNode={currentNode}
          doneLinkIds={doneLinkIds}
          doneNodeIds={doneNodeIds}
          highlightedNodeIds={highlightedNodeIds}
          pathTree={pathTree}
          universalTree={universalTree}
        />
      )}

      {/* Foreground Waze-style Bottom Card */}
      <Card
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "60vh",
          minHeight: "40vh",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          overflow: "hidden",
        }}
      >
        {/* Drag Handle (optional visual indicator) */}
        <Box
          sx={{
            width: 40,
            height: 4,
            backgroundColor: "grey.300",
            borderRadius: 2,
            alignSelf: "center",
            mt: 1,
            mb: 2,
          }}
        />

        <SearchInput
          value={searchTerm}
          onSearchChange={handleSearchChange}
          onKeyDown={handleKeyDown}
        />

        {/* Results or Recommended Section */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
          {pathTree ? (
            <PathList
              pathNodes={pathTree.nodes}
              currentNodeId={currentNodeId}
              doneNodeIds={doneNodeIds}
              onPathNodeClick={handlePathNodeClick}
            />
          ) : isSearchActive ? (
            <ResultsList
              results={searchResults}
              selectedResultId={selectedResultId}
              onResultSelect={handleResultSelect}
              searchTerm={searchTerm}
            />
          ) : (
            <RecommendedList recommendedNodes={recommendedNodes} />
          )}
        </Box>

        {/* Action Buttons */}
        <ActionButtons
          isSearchActive={isSearchActive}
          hasSearchResults={searchResults.length > 0}
          hasPath={Boolean(pathTree && pathTree.nodes.length > 0)}
          selectedResultId={selectedResultId}
          isMoveForwardEnabled={isMoveForwardEnabled()}
          onGeneratePath={handleGeneratePath}
          onMoveForward={handleMoveForward}
        />
      </Card>

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
            systemPrompt="You are a helpful assistant for the Web Brain Project Search Page. Assist users in searching for URLs or skills, and assist them in adding new material if the material they are looking for does not exist yet."
            customInstructions=""
            sx={{ height: "100%" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Search;
