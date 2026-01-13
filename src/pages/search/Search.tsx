import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
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
import { useState } from "react";

import { useSkillTreesContext } from "../../contexts/SkillTreesContext.tsx";
import type { Tree, WBNode } from "../../types/types";
import SearchPageChart from "./SearchPageChart.tsx";

/**
 * Search page component that allows users to search through the universal tree of skills and URLs.
 * Fetches data on mount and provides a search interface.
 *
 * @returns {JSX.Element} The rendered search page.
 */
function Search(): ReactNode {
  const { universalTree, isLoadingQuery } = useSkillTreesContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<WBNode[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Sample recommended nodes (you can replace this with actual logic)
  const recommendedNodes: WBNode[] = universalTree?.nodes.slice(0, 5) || [];

  /**
   * Searches for nodes in the tree that match the given query.
   *
   * @param {string} query - The search query string.
   * @param {Tree} tree - The tree structure to search within.
   * @returns {WBNode[]} An array of nodes that match the query.
   */
  function searchNodes(query: string, tree: Tree): WBNode[] {
    // search locally
    const queryResults = tree.nodes.filter((node) => nodeIsMatch(node, query));
    return queryResults;
  }

  /**
   * Checks if a given node matches the search query.
   * Matches both skill and URL nodes by name.
   *
   * @param {WBNode} node - The node to check for a match.
   * @param {string} query - The search query string.
   * @returns {boolean} True if the node matches the query, false otherwise.
   */
  function nodeIsMatch(node: WBNode, query: string): boolean {
    return node.name?.toLowerCase().includes(query.toLowerCase()) ?? false;
  }

  /**
   * Handles the search logic when a search term is provided.
   * Filters the universal tree and displays results.
   *
   * @param {string} term - The search term entered by the user.
   */
  const handleSearch = (term: string) => {
    if (!universalTree || !term.trim()) {
      setSearchResults([]);
      setIsSearchActive(false);
      return;
    }
    const results = searchNodes(term, universalTree);
    setSearchResults(results);
    setIsSearchActive(true);
  };

  /**
   * Handles key down events on the search input field.
   * Triggers search when the Enter key is pressed.
   *
   * @param {React.KeyboardEvent} event - The keyboard event object.
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch(searchTerm);
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
      {/* Background Chart */}
      {universalTree && (
        <SearchPageChart
          universalTree={universalTree}
          highlightedNodeIds={searchResults.map((node) => node.id)}
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
              setSearchTerm(e.target.value);
              if (!e.target.value.trim()) {
                setIsSearchActive(false);
                setSearchResults([]);
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
          {isSearchActive ? (
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
      </Card>
    </Box>
  );
}

export default Search;
