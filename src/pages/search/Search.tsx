import { Box, CircularProgress, TextField } from "@mui/material";
import { useEffect, useState } from "react";

import { fetchUniversalTree } from "../../services/services";
import type { Tree, WBNode } from "../../types/types";

/**
 * Search page component that allows users to search through the universal tree of skills and URLs.
 * Fetches data on mount and provides a search interface.
 *
 * @returns {JSX.Element} The rendered search page.
 */
function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [universalTree, setUniversalTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Loads the universal tree data from the API.
     * Sets the data in state and handles loading/errors.
     */
    const loadData = async () => {
      try {
        const data = await fetchUniversalTree();
        setUniversalTree(data);
        console.log(data);
      } catch (error) {
        console.error("Failed to fetch universal tree:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
   * Currently only matches skill-type nodes by name.
   *
   * @param {WBNode} node - The node to check for a match.
   * @param {string} query - The search query string.
   * @returns {boolean} True if the node matches the query, false otherwise.
   */
  function nodeIsMatch(node: WBNode, query: string): boolean {
    if (node.type === "skill") {
      return node.name?.toLowerCase().includes(query.toLowerCase());
    }
    return false;
  }

  /**
   * Handles the search logic when a search term is provided.
   * Filters the universal tree and logs results (placeholder for display logic).
   *
   * @param {string} term - The search term entered by the user.
   */
  const handleSearch = (term: string) => {
    if (!universalTree) return;
    // Placeholder: Filter through universalTree based on term
    console.log("Searching for:", term, "in", universalTree);
    // TODO: Implement filtering and display logic
    const results = searchNodes(searchTerm, universalTree);
    console.log(results);
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

  if (loading) {
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
    <>
      <TextField
        id="search-textbox"
        label="Search"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{
          position: "absolute",
          bottom: "20%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
    </>
  );
}

export default Search;
