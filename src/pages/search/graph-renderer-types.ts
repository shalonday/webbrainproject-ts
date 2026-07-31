import type { Tree, WBNode } from "../../types/types";

/**
 * Renderer-agnostic graph props consumed by chart implementations.
 *
 * Keep this interface aligned with the parity contract so renderers can be
 * swapped without changing Search page orchestration semantics.
 */
export interface GraphRendererProps {
  currentNode?: WBNode | null;
  doneLinkIds?: string[];
  doneNodeIds?: string[];
  doneNodeTimestamps?: Record<string, string>;
  initialFocusNodeId?: string | null;
  markedForStudyNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  onNodeTouchEnd?: (event: React.TouchEvent<SVGCircleElement>) => void;
  onNodeTouchStart?: (event: React.TouchEvent<SVGCircleElement>) => void;
  pathTree?: Tree | null;
  selectedNodeIds?: string[];
  tree: Tree;
}

/**
 * Props owned by SearchPageChart orchestration.
 */
export interface SearchPageChartProps {
  currentNode?: WBNode | null;
  doneLinkIds?: string[];
  doneNodeIds?: string[];
  doneNodeTimestamps?: Record<string, string>;
  highlightedNodeIds?: string[];
  markedForStudyNodeIds?: string[];
  onNodeTouchEnd?: (event: React.TouchEvent<SVGCircleElement>) => void;
  onNodeTouchStart?: (event: React.TouchEvent<SVGCircleElement>) => void;
  pathTree?: Tree | null;
  universalTree: Tree;
}