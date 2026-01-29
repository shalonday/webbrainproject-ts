import {
  ACTIVE_LINK_COLOR,
  ACTIVE_MODULE_FILL,
  ACTIVE_SKILL_FILL,
  DONE_LINK_COLOR,
  DONE_SKILL_FILL,
  DONE_URL_FILL,
  INACTIVE_LINK_COLOR,
  INACTIVE_MODULE_FILL,
  INACTIVE_SKILL_FILL,
} from "../../common-constants";
import type { Link, Tree, WBNode } from "../../types/types";

/** Lightweight representation of a link endpoint usable before/after D3 mutates links. */
type Endpoint = string | { id: string };

/** Minimal link shape for styling helpers without D3 coupling. */
export type LinkLike = Pick<Link, "id"> & {
  source: Endpoint;
  target: Endpoint;
};

/** Minimal node shape for styling helpers without D3 coupling. */
export type NodeLike = Pick<WBNode, "id" | "type">;

/** Narrow an endpoint to an object with an id when D3 has expanded links. */
export function isEndpointNode(endpoint: Endpoint): endpoint is { id: string } {
  return typeof endpoint !== "string";
}

/**
 * Determines the fill color for a node based on its type, selection, and completion state.
 *
 * @param node - The node to style.
 * @param selectedIds - Array of selected node IDs.
 * @param doneNodeIds - Array of completed/done node IDs.
 * @returns The appropriate fill color.
 */
export function getNodeFill(
  node: NodeLike,
  selectedIds: string[],
  doneNodeIds: string[],
): string {
  const isDone = doneNodeIds.includes(node.id);
  const isSelected = selectedIds.includes(node.id);

  if (isDone) {
    return node.type === "skill" ? DONE_SKILL_FILL : DONE_URL_FILL;
  }

  if (node.type === "skill") {
    return isSelected ? ACTIVE_SKILL_FILL : INACTIVE_SKILL_FILL;
  }
  if (node.type === "url") {
    return isSelected ? ACTIVE_MODULE_FILL : INACTIVE_MODULE_FILL;
  }
  return INACTIVE_SKILL_FILL;
}

/**
 * Determines whether a node is part of the current learning path.
 *
 * @param node - The simulated node to check.
 * @param pathTree - The current learning path tree.
 * @returns True when the node exists in the path tree.
 */
export function isNodeInPath(node: NodeLike, pathTree: Tree | null): boolean {
  if (!pathTree || pathTree?.nodes?.length === 0) return false;
  return pathTree.nodes.some((n) => n.id === node.id);
}

/**
 * Computes opacity for a node based on path membership.
 * Nodes in the path stay fully opaque; others are dimmed.
 *
 * @param node - The simulated node to style.
 * @param pathTree - The current learning path tree.
 * @returns Opacity value between 0 and 1.
 */
export function getNodeOpacity(node: NodeLike, pathTree: Tree | null): number {
  if (!pathTree || pathTree?.nodes?.length === 0) return 1;
  return isNodeInPath(node, pathTree) ? 1 : 0.25;
}

/**
 * Determines if a link is part of the path based on the path tree.
 *
 * @param link - The link to check.
 * @param pathTree - The tree structure representing the path.
 * @returns True if the link is in the path tree.
 */
export function isLinkInPath(link: LinkLike, pathTree: Tree | null): boolean {
  if (!pathTree || pathTree?.links?.length === 0) return false;

  const sourceId = isEndpointNode(link.source)
    ? link.source.id
    : (link.source as string);
  const targetId = isEndpointNode(link.target)
    ? link.target.id
    : (link.target as string);

  return Boolean(
    pathTree?.links?.some(
      (pathLink) =>
        pathLink.source === sourceId && pathLink.target === targetId,
    ),
  );
}

/**
 * Computes opacity for a link based on path membership.
 * Links in the path stay fully opaque; others are dimmed.
 *
 * @param link - The link datum to style.
 * @param pathTree - The current learning path tree.
 * @returns Opacity value between 0 and 1.
 */
export function getLinkOpacity(link: LinkLike, pathTree: Tree | null): number {
  if (!pathTree || pathTree?.links?.length === 0) return 1;
  return isLinkInPath(link, pathTree) ? 1 : 0.2;
}

/**
 * Determines whether a link is marked as done (completed).
 *
 * @param link - The link to check.
 * @param doneLinkIds - Array of completed link IDs.
 * @returns True if the link is marked as done.
 */
export function isLinkDone(link: LinkLike, doneLinkIds: string[]): boolean {
  return doneLinkIds.includes(link.id);
}

/**
 * Determines the stroke color for a link based on path membership and completion.
 *
 * @param link - The link to style.
 * @param pathTree - The current learning path tree.
 * @param doneLinkIds - Array of completed link IDs.
 * @returns The appropriate stroke color.
 */
export function getLinkColor(
  link: LinkLike,
  pathTree: Tree | null,
  doneLinkIds: string[],
): string {
  if (isLinkDone(link, doneLinkIds)) return DONE_LINK_COLOR;
  return isLinkInPath(link, pathTree) ? ACTIVE_LINK_COLOR : INACTIVE_LINK_COLOR;
}
