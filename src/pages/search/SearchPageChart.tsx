import { useMemo, useState } from "react";

import type { Tree, WBNode } from "../../types/types";
import D3Chart from "./D3Chart";
import { resolveInitialFocusNodeId } from "./search-utils";

interface SearchPageChartProps {
  currentNode?: WBNode | null;
  doneLinkIds?: string[];
  doneNodeIds?: string[];
  doneNodeTimestamps?: Record<string, string>;
  highlightedNodeIds?: string[];
  markedForStudyNodeIds?: string[];
  pathTree?: Tree | null;
  universalTree: Tree;
}

/**
 * Displays the skill tree visualization using D3Chart with node selection support.
 * Manages selected node IDs and provides click handler for toggling node selection.
 *
 * @param props - Component props.
 * @param props.universalTree - The complete graph of all nodes and links to display.
 * @param props.highlightedNodeIds - Optional array of node IDs to highlight from search results.
 * @param props.pathTree - Optional Tree structure representing the learning path to highlight.
 * @param props.currentNode - The current node in path traversal with throbbing animation.
 * @param props.doneNodeIds - Array of completed node IDs marked as done.
 * @param props.doneLinkIds - Array of completed link IDs marked as done.
 * @returns The rendered D3 chart visualization.
 */
function SearchPageChart({
  highlightedNodeIds = [],
  pathTree = null,
  universalTree,
  currentNode = null,
  doneNodeIds = [],
  doneLinkIds = [],
  doneNodeTimestamps = {},
  markedForStudyNodeIds = [],
}: SearchPageChartProps) {
  const [displayedTree] = useState(universalTree);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // Stable initial focus node derived once from progress timestamps
  const initialFocusNodeId = useMemo(
    () => resolveInitialFocusNodeId(doneNodeTimestamps, displayedTree),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // intentionally empty: computed once on mount from initial hydrated state
  );

  // Prioritize path nodes over search highlights
  const pathNodeIds = pathTree?.nodes?.map((node) => node.uuid) || [];
  const allSelectedNodeIds =
    pathNodeIds.length > 0
      ? pathNodeIds
      : [...new Set([...selectedNodeIds, ...highlightedNodeIds])];

  /**
   * Handles node click events to toggle node selection.
   */
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeIds((prevSelected) => {
      if (prevSelected.includes(nodeId)) {
        // Deselect if already selected
        return prevSelected.filter((id) => id !== nodeId);
      } else {
        // Add to selection
        return [...prevSelected, nodeId];
      }
    });
  };

  return (
    <>
      <D3Chart
        currentNode={currentNode}
        doneLinkIds={doneLinkIds}
        doneNodeIds={doneNodeIds}
        doneNodeTimestamps={doneNodeTimestamps}
        initialFocusNodeId={initialFocusNodeId}
        markedForStudyNodeIds={markedForStudyNodeIds}
        onNodeClick={handleNodeClick}
        pathTree={pathTree}
        selectedNodeIds={allSelectedNodeIds}
        tree={displayedTree}
      />
    </>
  );
}

export default SearchPageChart;
