import { DEFAULT_START_NODE_ID } from "../constants/graph";
import type { SearchResult } from "../types/types";

/**
 * Build a path link for the D3 graph visualization.
 * Uses the default start node when only one node is provided.
 */
export function buildPathLink(startId: string, endId?: string): string {
  if (endId) {
    return `/paths/${encodeURIComponent(startId)}/${encodeURIComponent(endId)}`;
  }
  return `/paths/${encodeURIComponent(DEFAULT_START_NODE_ID)}/${encodeURIComponent(startId)}`;
}

/**
 * Build path links for search results.
 */
export function buildResultLinks(
  results: SearchResult[],
  startNodeId: string = DEFAULT_START_NODE_ID,
): Array<{ nodeId: string; name: string; link: string }> {
  return results.map((result) => ({
    nodeId: result.node.id,
    name: result.node.name,
    link: buildPathLink(startNodeId, result.node.id),
  }));
}
