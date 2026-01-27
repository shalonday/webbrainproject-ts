import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import type { WBNode } from "../../types/types";
import SearchPageChart from "./SearchPageChart";
import { useSearchPageState } from "./useSearchPageState";

/**
 * Search page component that allows users to search through the universal tree of skills and URLs.
 * Fetches data on mount and provides a search interface with path generation capability.
 *
 * @returns {ReactNode} The rendered search page.
 */
function Search(): ReactNode {
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

        {/* Search Input */}
        <Box sx={{ px: 3, pb: 2 }}>
          <TextField
            id="search-textbox"
            placeholder="Search for a skill or URL"
            aria-label="search"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => {
              const nextTerm = e.target.value;
              setSearchTerm(nextTerm);
              if (!nextTerm.trim()) {
                handleSearch("");
              }
            }}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "grey.100",
              },
            }}
          />
        </Box>

        {/* Results or Recommended Section */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
          {pathTree ? (
            // Learning Path Display
            <>
              <Typography
                variant="subtitle2"
                sx={{ px: 1, py: 1, color: "text.secondary" }}
              >
                Learning Path
              </Typography>
              <List>
                {pathTree.nodes.map((node) => (
                  <ListItem key={node.id} disablePadding>
                    <ListItemButton
                      onClick={() => handlePathNodeClick(node)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        backgroundColor:
                          currentNode?.id === node.id
                            ? "primary.light"
                            : "transparent",
                        "&:hover": {
                          backgroundColor:
                            currentNode?.id === node.id
                              ? "primary.light"
                              : "action.hover",
                        },
                      }}
                    >
                      <ListItemText
                        primary={node.name}
                        secondary={`Type: ${node.type}${doneNodeIds.includes(node.id) ? " • Done" : node.id === currentNodeId ? " • Current" : ""}`}
                        primaryTypographyProps={{
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          ) : isSearchActive ? (
            // Search Results
            <>
              <Typography
                variant="subtitle2"
                sx={{ px: 1, py: 1, color: "text.secondary" }}
              >
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""} found
              </Typography>
              <List>
                {searchResults.map((node) => (
                  <ListItem key={node.id} disablePadding>
                    <ListItemButton
                      selected={selectedResultId === node.id}
                      onClick={() => handleResultSelect(node.id)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                      }}
                    >
                      <ListItemText
                        primary={node.name}
                        secondary={`Type: ${node.type}`}
                        primaryTypographyProps={{
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {searchResults.length === 0 && (
                  <Typography
                    variant="body2"
                    sx={{ px: 1, py: 2, color: "text.secondary" }}
                  >
                    No results found for &quot;{searchTerm}&quot;
                  </Typography>
                )}
              </List>
            </>
          ) : (
            // Recommended Results
            <>
              <Typography
                variant="subtitle2"
                sx={{ px: 1, py: 1, color: "text.secondary" }}
              >
                Recommended Skills
              </Typography>
              <List>
                {recommendedNodes.map((node) => (
                  <ListItem key={node.id} disablePadding>
                    <ListItemButton
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                      }}
                    >
                      <ListItemText
                        primary={node.name}
                        secondary={`Type: ${node.type}`}
                        primaryTypographyProps={{
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {recommendedNodes.length === 0 && (
                  <Typography
                    variant="body2"
                    sx={{ px: 1, py: 2, color: "text.secondary" }}
                  >
                    No recommendations available
                  </Typography>
                )}
              </List>
            </>
          )}
        </Box>

        {/* Generate Path Button */}
        {isSearchActive && searchResults.length > 0 && !pathTree && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              disabled={!selectedResultId}
              onClick={handleGeneratePath}
              sx={{
                borderRadius: 2,
                py: 1.5,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Generate Learning Path
            </Button>
          </Box>
        )}

        {/* Move Forward Button */}
        {pathTree && pathTree.nodes.length > 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              disabled={!isMoveForwardEnabled()}
              onClick={handleMoveForward}
              sx={{
                borderRadius: 2,
                py: 1.5,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Move Forward
            </Button>
          </Box>
        )}
      </Card>
    </Box>
  );
}

export default Search;
