import { useState } from "react";

import type { Tree } from "../../types/types";
import D3Chart from "./D3Chart";

interface SearchPageChartProps {
  universalTree: Tree;
}

/**
 * Displays the skill tree visualization using D3Chart.
 * Currently focused on displaying the universal tree without selection features.
 *
 * @param props - Component props.
 * @param props.universalTree - The complete graph of all nodes and links to display.
 * @returns The rendered D3 chart visualization.
 */
function SearchPageChart({ universalTree }: SearchPageChartProps) {
  const [displayedTree] = useState(universalTree);

  return (
    <>
      <D3Chart tree={displayedTree} />
    </>
  );
}

export default SearchPageChart;
