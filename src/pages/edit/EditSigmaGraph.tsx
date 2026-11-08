import { useMemo } from "react";

import type { AnalyzeResponse } from "../../types/types";
import { createAnalyzeResponseTree } from "./createAnalyzeResponseTree";

export interface EditSigmaGraphProps {
  analyzeResponse: AnalyzeResponse;
}

/**
 * Prepares the analyzed graph tree for the edit-page renderer.
 *
 * @param props - The analyzed response to visualize.
 * @returns A graph container with its node and link counts.
 */
function EditSigmaGraph({ analyzeResponse }: EditSigmaGraphProps) {
  const tree = useMemo(
    () => createAnalyzeResponseTree(analyzeResponse),
    [analyzeResponse],
  );

  return (
    <div
      data-link-count={tree.links.length}
      data-node-count={tree.nodes.length}
      data-testid="edit-sigma-graph"
    />
  );
}

export default EditSigmaGraph;
