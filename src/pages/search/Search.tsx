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
import { useState } from "react";

import { BASE_URL } from "../../common-constants";
import { useSkillTreesContext } from "../../contexts/SkillTreesContext.tsx";
import type { Link, Tree, WBNode } from "../../types/types";
import SearchPageChart from "./SearchPageChart.tsx";

/**
 * Search page component that allows users to search through the universal tree of skills and URLs.
 * Fetches data on mount and provides a search interface with path generation capability.
 *
 * @returns {JSX.Element} The rendered search page.
 */
function Search(): ReactNode {
  const { universalTree, isLoadingQuery } = useSkillTreesContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<WBNode[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [pathTree, setPathTree] = useState<Tree | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [doneNodeIds, setDoneNodeIds] = useState<string[]>([]);
  const [doneLinkIds, setDoneLinkIds] = useState<string[]>([]);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);

  // Sample recommended nodes (you can replace this with actual logic)
  const recommendedNodes: WBNode[] = universalTree?.nodes.slice(0, 5) || [];

  const currentNode =
    pathTree?.nodes.find((n) => n.id === currentNodeId) || null;

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
    setSelectedResultId(null);
    setPathTree(null);
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

  /**
   * Handles generating a learning path from skill node "E" to the selected result.
   * Fetches the path from the backend and highlights all nodes along the path.
   */
  const handleGeneratePath = async () => {
    if (!selectedResultId) {
      return;
    }

    // Clear existing highlights before fetching path
    setSearchResults([]);
    setPathTree(null);

    try {
      const startNodeId = "97838643-4e9b-434f-8985-89dd23408647"; // TEMPORARY hardcoded start node ID of "E"
      const response = await fetch(
        `${BASE_URL}/paths/${startNodeId}/${selectedResultId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch path: ${response.statusText}`);
      }

      const data = await response.json();
      const pathTree: Tree = { nodes: data.nodes, links: data.links };
      setPathTree(pathTree);
      setCurrentNodeId(pathTree.nodes.length > 0 ? pathTree.nodes[0].id : null);
      setDoneNodeIds([]);
      setDoneLinkIds([]);
      setVisitedNodeIds([]);

      // Trigger landing on the first node
      if (pathTree.nodes.length > 0) {
        setVisitedNodeIds([pathTree.nodes[0].id]);
        handleLandOnNode(pathTree.nodes[0]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating path:", error);
      setPathTree(null);
    }
  };

  /**
   * Placeholder function that triggers when landing on a URL node.
   * Will be implemented later.
   *
   * @param {WBNode} node - The URL node that was landed on.
   */
  const handleLandOnUrlNode = (node: WBNode) => {
    // eslint-disable-next-line no-console
    console.log("Landed on URL node:", node);
    // TODO: Implement URL node landing behavior
  };

  /**
   * Placeholder function that triggers when landing on a skill node.
   * Will be implemented later.
   *
   * @param {WBNode} node - The skill node that was landed on.
   */
  const handleLandOnSkillNode = (node: WBNode) => {
    // eslint-disable-next-line no-console
    console.log("Landed on skill node:", node);
    // TODO: Implement skill node landing behavior
  };

  /**
   * Dispatches to the appropriate landing handler based on node type.
   *
   * @param {WBNode} node - The node that was landed on.
   */
  const handleLandOnNode = (node: WBNode) => {
    if (node.type === "url") {
      handleLandOnUrlNode(node);
    } else if (node.type === "skill") {
      handleLandOnSkillNode(node);
    }
  };

  /**
   * Determines if the Move Forward button should be enabled.
   * Button is enabled if there are outgoing links from the current node.
   *
   * @returns {boolean} True if Move Forward button should be enabled.
   */
  const isMoveForwardEnabled = (): boolean => {
    if (!pathTree || !currentNodeId) {
      return false;
    }
    // Check if there are any outgoing links from current node
    const outgoingLinks = pathTree.links.filter(
      (link) => link.source === currentNodeId,
    );
    return outgoingLinks.length > 0;
  };

  /**   * Checks if a URL node has all its skill prerequisites completed.
   * Looks at the universal tree to find all nodes that have links to this URL.
   *
   * @param {WBNode} urlNode - The URL node to check.
   * @param {string[]} additionalDoneIds - Additional node IDs to consider as done.
   * @returns {boolean} True if all skill prerequisites are done.
   */
  const hasAllSkillPrerequisitesDone = (
    urlNode: WBNode,
    additionalDoneIds: string[] = [],
  ): boolean => {
    if (!universalTree || urlNode.type !== "url") return true;

    // Find all nodes that link to this URL (prerequisites)
    const prerequisiteNodeIds = universalTree.links
      .filter((link) => link.target === urlNode.id)
      .map((link) => link.source);

    // Get the actual nodes
    const prerequisiteNodes = universalTree.nodes.filter((node) =>
      prerequisiteNodeIds.includes(node.id),
    );

    // Check if all skill prerequisites are done
    const skillPrerequisites = prerequisiteNodes.filter(
      (node) => node.type === "skill",
    );
    const allDoneIds = [...doneNodeIds, ...additionalDoneIds];
    return skillPrerequisites.every((node) => allDoneIds.includes(node.id));
  };

  /**
   * Moves to the next node in the learning path by following outgoing links.
   * Marks the current node and link as done before advancing.
   * If the next node is a URL with incomplete skill prerequisites, backtracks to an undone branching target.
   */
  const handleMoveForward = () => {
    if (!pathTree || !currentNodeId) {
      return;
    }

    // Mark current node as done
    setDoneNodeIds((prev) => [...prev, currentNodeId]);

    // Find all outgoing links from current node
    const outgoingLinks = pathTree.links.filter(
      (link) => link.source === currentNodeId,
    );

    if (outgoingLinks.length === 0) {
      return;
    }

    // Find first undone target node
    let targetLink = null;
    let targetNode = null;

    for (const link of outgoingLinks) {
      const node = pathTree.nodes.find((n) => n.id === link.target);
      if (node && !doneNodeIds.includes(node.id)) {
        // Check if this URL has prerequisites satisfied
        if (
          node.type === "url" &&
          !hasAllSkillPrerequisitesDone(node, [currentNodeId])
        ) {
          // Prerequisites not met, look for alternative branch
          continue;
        }
        targetLink = link;
        targetNode = node;
        break;
      }
    }

    // If no valid forward target, try to backtrack to an undone branch
    if (!targetNode) {
      const backtrackTarget = findUndoneBranchTarget();
      if (backtrackTarget) {
        targetNode = backtrackTarget.node;
        targetLink = backtrackTarget.link;
      } else {
        return;
      }
    }

    // Mark the link(s) as done
    if (targetLink) {
      // If target is a URL with multiple prerequisites, mark all incoming links as done
      if (targetNode.type === "url") {
        const allIncomingLinks = pathTree.links.filter(
          (link) => link.target === targetNode.id,
        );
        const incomingLinkIds = allIncomingLinks.map((link) => link.id);
        setDoneLinkIds((prev) => [...prev, ...incomingLinkIds]);
      } else {
        // For skill nodes, just mark the single link
        setDoneLinkIds((prev) => [...prev, targetLink.id]);
      }
    }

    // Move to target node
    setCurrentNodeId(targetNode.id);
    setVisitedNodeIds((prev) => [...prev, targetNode.id]);
    handleLandOnNode(targetNode);
  };

  /**
   * Finds an undone node from a previously visited branching node.
   * Returns the node and the link leading to it.
   */
  const findUndoneBranchTarget = (): { node: WBNode; link: Link } | null => {
    if (!pathTree) return null;

    // Check all visited nodes for branches with undone targets
    for (const visitedId of visitedNodeIds) {
      const outgoingLinks = pathTree.links.filter(
        (link) => link.source === visitedId,
      );

      // Only consider branching nodes (more than one outgoing link)
      if (outgoingLinks.length <= 1) continue;

      // Find first undone target
      for (const link of outgoingLinks) {
        const node = pathTree.nodes.find((n) => n.id === link.target);
        if (node && !doneNodeIds.includes(node.id)) {
          return { node, link };
        }
      }
    }

    return null;
  };

  /**
   * Handles clicking on a path node card.
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
          highlightedNodeIds={searchResults.map((node) => node.id)}
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
                      onClick={() => {
                        setSelectedResultId(node.id);
                        setPathTree(null);
                      }}
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
        {isSearchActive && searchResults.length > 0 && (
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
