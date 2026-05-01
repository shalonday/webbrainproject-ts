import * as d3 from "d3";
import { useEffect, useRef } from "react";

import {
  ACTIVE_LINK_COLOR,
  DONE_LINK_COLOR,
  INACTIVE_LINK_COLOR,
  MINOR_RADIUS,
  RADIUS,
} from "../../common-constants";
import type { Link, Tree, WBNode } from "../../types/types";
import {
  getLinkColor,
  getLinkOpacity,
  getNodeFill,
  getNodeOpacity,
  isLinkDone,
  isLinkInPath,
} from "./graph-styles";

// Vitest sets NODE_ENV="test" automatically; Vite sets it for dev/prod builds
const IS_TEST_ENV = import.meta.env.MODE === "test";

// Must match the viewBox attribute on the SVG element so simulation coordinates
// map directly onto visible SVG space without any coordinate-space mismatch.
const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 400;
const CAMERA_FOLLOW_LERP = 0.18;
const CAMERA_SETTLE_THRESHOLD = 0.5;

// Type representing a WBNode augmented with D3 simulation properties
type SimulatedWBNode = WBNode & d3.SimulationNodeDatum;

// Union type for source/target that can be either a string ID or a simulated node
type LinkEndpoint = string | SimulatedWBNode;

// Type for links after D3 simulation transforms source/target from IDs to node objects
type SimulatedLink = Omit<Link, "source" | "target"> & {
  source: SimulatedWBNode;
  target: SimulatedWBNode;
};

// Union type for links that can be in either initial state or simulated state
type LinkDatum = Link | SimulatedLink;

/**
 * Type guard to check if a link endpoint is a SimulatedWBNode (not a string ID).
 *
 * @param endpoint - The link endpoint to check.
 * @returns True if the endpoint is a SimulatedWBNode.
 */
function isSimulatedNode(endpoint: LinkEndpoint): endpoint is SimulatedWBNode {
  return typeof endpoint !== "string";
}

/**
 * Formats a node type for human-readable tooltip text.
 */
function formatNodeTypeLabel(type: WBNode["type"]): string {
  if (type === "url") return "URL";
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

interface D3ChartProps {
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

type LinkSelection = d3.Selection<
  SVGLineElement,
  LinkDatum,
  SVGGElement | null,
  unknown
>;
type NodeSelection = d3.Selection<
  SVGCircleElement,
  SimulatedWBNode,
  SVGGElement | null,
  unknown
>;

interface ZoomBinding {
  svgSelection: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>;
}

/**
 * Attaches pan/zoom behavior to the SVG and applies transforms to the graph group.
 */
function setupZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  gNodeAndLinkRef: React.RefObject<SVGGElement | null>,
): ZoomBinding | null {
  if (IS_TEST_ENV || typeof document === "undefined" || !svgRef.current) {
    return null;
  }

  const svgSelection = d3.select(svgRef.current);
  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 4])
    .on("zoom", (event) => {
      d3.select(gNodeAndLinkRef.current).attr("transform", event.transform);
    });

  // Remove prior zoom handlers before applying a new one
  svgSelection.on(".zoom", null).call(zoomBehavior);

  return { svgSelection, zoomBehavior };
}

/**
 * Creates a D3 force simulation with physics-based positioning.
 * Applies forces for link tension, charge repulsion, and center attraction.
 *
 * @param nodes - Array of nodes to simulate.
 * @param links - Array of links connecting nodes.
 * @param width - Canvas width for center-force positioning.
 * @param height - Canvas height for center-force positioning.
 * @param ticked - Callback invoked on each simulation tick for position updates.
 * @returns The initialized force simulation.
 */
function createSimulation(
  nodes: SimulatedWBNode[],
  links: LinkDatum[],
  width: number,
  height: number,
  ticked: () => void,
) {
  return d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink<SimulatedWBNode, (typeof links)[0]>(links).id((d) => d.uuid),
    )
    .force("charge", d3.forceManyBody().strength(-30))
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2))
    .on("tick", ticked);
}

/**
 * Renders link elements with D3 selection binding.
 * Sets stroke color and marker endpoint for visual directionality.
 *
 * @param gLinkRef - Reference to the SVG group containing link elements.
 * @param links - Array of link data to bind to elements.
 * @param pathTree - The tree structure representing the path.
 * @param doneLinkIds - Array of completed link IDs.
 * @returns D3 selection of rendered line elements for further manipulation.
 */
function renderLinks(
  gLinkRef: React.RefObject<SVGGElement | null>,
  links: LinkDatum[],
  pathTree: Tree | null,
  doneLinkIds: string[],
): LinkSelection {
  return d3
    .select(gLinkRef.current)
    .selectAll<SVGLineElement, LinkDatum>("line")
    .data(links)
    .attr("stroke", (d) => getLinkColor(d, pathTree, doneLinkIds))
    .attr("opacity", (d) => getLinkOpacity(d, pathTree))
    .attr("stroke-width", 1)
    .attr("marker-end", (d) => {
      if (isLinkDone(d, doneLinkIds)) return "url(#arrow-done)";
      return isLinkInPath(d, pathTree) ? "url(#arrow-active)" : "url(#arrow)";
    });
}
/**
 * Updates node fill and opacity based on selection state and path membership.
 * Called when selection or path changes without recreating the simulation.
 *
 * @param gNodeRef - Reference to the SVG group containing node elements.
 * @param selectedNodeIds - Array of selected node IDs for styling.
 * @param pathTree - The current learning path tree (used to dim non-path nodes).
 * @param doneNodeIds - Array of completed node IDs.
 * @param markedForStudyNodeIds - Array of node IDs flagged as study targets.
 */
function updateNodeColors(
  gNodeRef: React.RefObject<SVGGElement | null>,
  selectedNodeIds: string[],
  pathTree: Tree | null,
  doneNodeIds: string[],
  markedForStudyNodeIds: string[],
) {
  d3.select(gNodeRef.current)
    .selectAll<SVGCircleElement, SimulatedWBNode>("circle")
    .attr("fill", (d) =>
      getNodeFill(d, selectedNodeIds, doneNodeIds, markedForStudyNodeIds),
    )
    .attr("opacity", (d) => getNodeOpacity(d, pathTree));
}

/**
 * Updates link stroke color, width, marker, and opacity based on path state.
 * Called when pathTree changes without recreating the simulation.
 *
 * @param gLinkRef - Reference to the SVG group containing link elements.
 * @param pathTree - The tree structure representing the path.
 * @param doneLinkIds - Array of completed link IDs.
 */
function updateLinkColors(
  gLinkRef: React.RefObject<SVGGElement | null>,
  pathTree: Tree | null,
  doneLinkIds: string[],
) {
  d3.select(gLinkRef.current)
    .selectAll<SVGLineElement, LinkDatum>("line")
    .attr("stroke", (d) => getLinkColor(d, pathTree, doneLinkIds))
    .attr("opacity", (d) => getLinkOpacity(d, pathTree))
    .attr("stroke-width", 1)
    .attr("marker-end", (d) => {
      if (isLinkDone(d, doneLinkIds)) return "url(#arrow-done)";
      return isLinkInPath(d, pathTree) ? "url(#arrow-active)" : "url(#arrow)";
    });
}

/**
 * Renders node circles with styling and drag behavior.
 * Applies radius and fill based on node type (skill/url) and selection state.
 *
 * @param gNodeRef - Reference to the SVG group containing node elements.
 * @param nodes - Array of nodes to render.
 * @param selectedNodeIds - Array of selected node IDs for styling.
 * @param simulation - Force simulation for drag interaction.
 * @param pathTree - The current learning path tree.
 * @param doneNodeIds - Array of completed node IDs.
 * @param markedForStudyNodeIds - Array of node IDs flagged as study targets.
 * @returns D3 selection of rendered circle elements.
 */
function renderNodes(
  gNodeRef: React.RefObject<SVGGElement | null>,
  nodes: SimulatedWBNode[],
  selectedNodeIds: string[],
  simulation: d3.Simulation<
    SimulatedWBNode,
    d3.SimulationLinkDatum<SimulatedWBNode>
  >,
  pathTree: Tree | null,
  doneNodeIds: string[],
  markedForStudyNodeIds: string[],
): NodeSelection {
  return d3
    .select(gNodeRef.current)
    .selectAll<SVGCircleElement, SimulatedWBNode>("circle")
    .data(nodes)
    .attr("r", (d) =>
      d.type === "skill" || d.type === "url" ? RADIUS : MINOR_RADIUS,
    )
    .attr("fill", (d) =>
      getNodeFill(d, selectedNodeIds, doneNodeIds, markedForStudyNodeIds),
    )
    .attr("opacity", (d) => getNodeOpacity(d, pathTree))
    .call((selection) => {
      // Skip drag hookup in test environments or when DOM is unavailable
      if (IS_TEST_ENV || typeof document === "undefined" || !gNodeRef.current) {
        return selection;
      }
      return selection.call(createDrag(simulation));
    });
}

/**
 * Creates a drag behavior for graph nodes.
 * Allows nodes to be interactively dragged while maintaining the force simulation.
 * Based on: https://observablehq.com/@d3/force-directed-graph-component
 */
function createDrag(
  simulation: d3.Simulation<
    SimulatedWBNode,
    d3.SimulationLinkDatum<SimulatedWBNode>
  >,
) {
  /**
   * Handles drag start: pins node and restarts simulation.
   */
  function dragstarted(
    event: d3.D3DragEvent<SVGCircleElement, SimulatedWBNode, SimulatedWBNode>,
  ) {
    // onNodeTouchStart(event); // put the touch events within the drag events because I don't know how to trigger the longtouch otherwise
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  /**
   * Handles dragging: updates node position during drag.
   */
  function dragged(
    event: d3.D3DragEvent<SVGCircleElement, SimulatedWBNode, SimulatedWBNode>,
  ) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  /**
   * Handles drag end: releases node and cools simulation.
   */
  function dragended(
    event: d3.D3DragEvent<SVGCircleElement, SimulatedWBNode, SimulatedWBNode>,
  ) {
    // onNodeTouchEnd(event);
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3
    .drag<SVGCircleElement, SimulatedWBNode>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

/**
 * Updates SVG element positions from simulation node/link coordinates.
 * Called on each simulation tick to animate graph layout.
 *
 * @param link - D3 selection of link elements to update.
 * @param node - D3 selection of node elements to update.
 */
function updatePositions(link: LinkSelection, node: NodeSelection) {
  link
    .attr("x1", (d) => {
      if (!isSimulatedNode(d.source) || !isSimulatedNode(d.target)) {
        return 0;
      }

      const sourceX = d.source.x ?? 0;
      const sourceY = d.source.y ?? 0;
      const targetX = d.target.x ?? 0;
      const targetY = d.target.y ?? 0;
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const distance = Math.hypot(dx, dy) || 1;
      const sourceRadius =
        d.source.type === "skill" || d.source.type === "url"
          ? RADIUS
          : MINOR_RADIUS;

      return sourceX + (dx / distance) * (sourceRadius + 1);
    })
    .attr("y1", (d) => {
      if (!isSimulatedNode(d.source) || !isSimulatedNode(d.target)) {
        return 0;
      }

      const sourceX = d.source.x ?? 0;
      const sourceY = d.source.y ?? 0;
      const targetX = d.target.x ?? 0;
      const targetY = d.target.y ?? 0;
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const distance = Math.hypot(dx, dy) || 1;
      const sourceRadius =
        d.source.type === "skill" || d.source.type === "url"
          ? RADIUS
          : MINOR_RADIUS;

      return sourceY + (dy / distance) * (sourceRadius + 1);
    })
    .attr("x2", (d) => {
      if (!isSimulatedNode(d.source) || !isSimulatedNode(d.target)) {
        return 0;
      }

      const sourceX = d.source.x ?? 0;
      const sourceY = d.source.y ?? 0;
      const targetX = d.target.x ?? 0;
      const targetY = d.target.y ?? 0;
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const distance = Math.hypot(dx, dy) || 1;
      const targetRadius =
        d.target.type === "skill" || d.target.type === "url"
          ? RADIUS
          : MINOR_RADIUS;

      return targetX - (dx / distance) * (targetRadius + 2);
    })
    .attr("y2", (d) => {
      if (!isSimulatedNode(d.source) || !isSimulatedNode(d.target)) {
        return 0;
      }

      const sourceX = d.source.x ?? 0;
      const sourceY = d.source.y ?? 0;
      const targetX = d.target.x ?? 0;
      const targetY = d.target.y ?? 0;
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const distance = Math.hypot(dx, dy) || 1;
      const targetRadius =
        d.target.type === "skill" || d.target.type === "url"
          ? RADIUS
          : MINOR_RADIUS;

      return targetY - (dy / distance) * (targetRadius + 2);
    });

  node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
}

/**
 * Orchestrates the D3 force-directed graph setup and rendering.
 * Creates simulation, renders nodes/links, and wires update callbacks.
 * Pre-positions the focus node at the viewport target so the initial
 * simulation animation heads toward the correct location from frame one.
 *
 * @param data - Tree data containing nodes and links.
 * @param selectedNodeIds - Array of selected node IDs for styling.
 * @param pathTree - The tree structure representing the path.
 * @param gNodeAndLinkRef - Reference to the main SVG group.
 * @param gLinkRef - Reference to the links SVG group.
 * @param gNodeRef - Reference to the nodes SVG group.
 * @param svgRef - Reference to the SVG element.
 * @param doneNodeIds - Array of completed node IDs.
 * @param doneLinkIds - Array of completed link IDs.
 * @param markedForStudyNodeIds - Array of node IDs flagged as study targets.
 * @param initialFocusNodeId - UUID of node to pre-position at the viewport target.
 */
function ForceGraph(
  data: Tree,
  selectedNodeIds: string[],
  pathTree: Tree | null,
  gNodeAndLinkRef: React.RefObject<SVGGElement | null>,
  gLinkRef: React.RefObject<SVGGElement | null>,
  gNodeRef: React.RefObject<SVGGElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
  doneNodeIds: string[],
  doneLinkIds: string[],
  markedForStudyNodeIds: string[],
  initialFocusNodeId: string | null = null,
) {
  // The force simulation mutates links and nodes, so create a copy
  // so that re-evaluating this cell produces the same result.
  const links = data.links?.map((d) => ({ ...d })) || [];
  const nodes = data.nodes?.map((d) => ({ ...d })) || ([] as SimulatedWBNode[]);

  // Seed the focus node at the intended viewport target (x-center, top quarter)
  // so the simulation animates from there rather than from a random start position.
  if (initialFocusNodeId) {
    // Cast is safe: D3 simulation will add x/y to these node objects in-place
    const focusNode = nodes.find((n) => n.uuid === initialFocusNodeId) as
      | SimulatedWBNode
      | undefined;
    if (focusNode) {
      focusNode.x = VIEWBOX_WIDTH / 2;
      focusNode.y = VIEWBOX_HEIGHT * 0.25;
    }
  }

  const linkSelection = renderLinks(gLinkRef, links, pathTree, doneLinkIds);

  const zoomBinding = setupZoom(svgRef, gNodeAndLinkRef);

  const simulation = createSimulation(
    nodes,
    links,
    VIEWBOX_WIDTH,
    VIEWBOX_HEIGHT,
    () => updatePositions(linkSelection, nodeSelection),
  );

  const nodeSelection = renderNodes(
    gNodeRef,
    nodes,
    selectedNodeIds,
    simulation,
    pathTree,
    doneNodeIds,
    markedForStudyNodeIds,
  );

  // Smoothly keep the focus node near the target viewport point while the layout
  // settles to avoid a visible end-of-simulation teleport.
  if (initialFocusNodeId && zoomBinding && !IS_TEST_ENV) {
    simulation.on("tick.center-focus", () => {
      const focusNode = nodes.find((n) => n.uuid === initialFocusNodeId) as
        | SimulatedWBNode
        | undefined;
      if (
        !focusNode ||
        typeof focusNode.x !== "number" ||
        typeof focusNode.y !== "number"
      ) {
        return;
      }

      const targetX = VIEWBOX_WIDTH / 2;
      const targetY = VIEWBOX_HEIGHT * 0.25;
      const desiredTx = targetX - focusNode.x;
      const desiredTy = targetY - focusNode.y;

      const currentTransform = d3.zoomTransform(
        zoomBinding.svgSelection.node()!,
      );
      const nextTx =
        currentTransform.x +
        (desiredTx - currentTransform.x) * CAMERA_FOLLOW_LERP;
      const nextTy =
        currentTransform.y +
        (desiredTy - currentTransform.y) * CAMERA_FOLLOW_LERP;

      const transform = d3.zoomIdentity
        .translate(nextTx, nextTy)
        .scale(currentTransform.k);

      zoomBinding.svgSelection.call(
        zoomBinding.zoomBehavior.transform,
        transform,
      );

      const dx = Math.abs(desiredTx - nextTx);
      const dy = Math.abs(desiredTy - nextTy);
      if (dx < CAMERA_SETTLE_THRESHOLD && dy < CAMERA_SETTLE_THRESHOLD) {
        simulation.on("tick.center-focus", null);
      }
    });
  }
}

/**
 * D3.js force-directed graph visualization component.
 * Renders an interactive graph of nodes and links with dragging and zooming capabilities.
 *
 * @param props - Component props.
 * @param props.tree - The graph data containing nodes and links.
 * @param props.onNodeClick - Callback for node click events.
 * @param props.onNodeTouchStart - Callback for touch start events on nodes.
 * @param props.onNodeTouchEnd - Callback for touch end events on nodes.
 * @param props.selectedNodeIds - Array of node IDs to highlight as selected.
 * @param props.currentNode - The currently active/animated node.
 * @returns The rendered SVG visualization.
 */
export default function D3Chart({
  tree,
  onNodeClick = () => {},
  onNodeTouchStart = () => {},
  onNodeTouchEnd = () => {},
  pathTree = null,
  selectedNodeIds = [],
  currentNode = null,
  doneNodeIds = [],
  doneLinkIds = [],
  doneNodeTimestamps = {},
  initialFocusNodeId = null,
  markedForStudyNodeIds = [],
}: D3ChartProps) {
  const gLinkRef = useRef<SVGGElement>(null);
  const gNodeRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gNodeAndLinkRef = useRef<SVGGElement>(null);
  const isPathActive = Boolean(pathTree && pathTree.nodes?.length);

  // Create simulation only when tree data changes.
  // initialFocusNodeId seeds the focus node position before the first tick
  // so the simulation animates toward the correct location from the start.
  useEffect(() => {
    ForceGraph(
      tree,
      selectedNodeIds,
      pathTree,
      gNodeAndLinkRef,
      gLinkRef,
      gNodeRef,
      svgRef,
      doneNodeIds,
      doneLinkIds,
      markedForStudyNodeIds,
      initialFocusNodeId,
    );
    // selectedNodeIds, pathTree, doneNodeIds, doneLinkIds intentionally excluded: updates handled by separate effects
    // Refs are stable and don't need to be dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, initialFocusNodeId]);

  // Update node colors when selection changes without recreating simulation
  useEffect(() => {
    updateNodeColors(
      gNodeRef,
      selectedNodeIds,
      pathTree,
      doneNodeIds,
      markedForStudyNodeIds,
    );
  }, [selectedNodeIds, pathTree, doneNodeIds, markedForStudyNodeIds]);

  // Update link colors when path changes without recreating simulation
  useEffect(() => {
    updateLinkColors(gLinkRef, pathTree, doneLinkIds);
    updateNodeColors(
      gNodeRef,
      selectedNodeIds,
      pathTree,
      doneNodeIds,
      markedForStudyNodeIds,
    );
  }, [
    pathTree,
    selectedNodeIds,
    doneNodeIds,
    doneLinkIds,
    markedForStudyNodeIds,
  ]);

  return (
    <div
      style={{
        height: "85vh",
        width: "100vw",
        backgroundColor: isPathActive ? "#f5f5f5" : "transparent",
      }}
    >
      <svg
        ref={svgRef}
        style={{ height: "100%", width: "100%" }}
        viewBox="0 0 400 400"
      >
        <defs>
          <marker
            id="arrow"
            markerHeight="4"
            markerUnits="userSpaceOnUse"
            markerWidth="4"
            orient="auto"
            refX="3.5"
            refY="2"
            viewBox="0 0 4 4"
          >
            <path d="M 0 0 L 4 2 L 0 4 z" fill={INACTIVE_LINK_COLOR} />
          </marker>
          <marker
            id="arrow-active"
            markerHeight="4"
            markerUnits="userSpaceOnUse"
            markerWidth="4"
            orient="auto"
            refX="3.5"
            refY="2"
            viewBox="0 0 4 4"
          >
            <path d="M 0 0 L 4 2 L 0 4 z" fill={ACTIVE_LINK_COLOR} />
          </marker>
          <marker
            id="arrow-done"
            markerHeight="4"
            markerUnits="userSpaceOnUse"
            markerWidth="4"
            orient="auto"
            refX="3.5"
            refY="2"
            viewBox="0 0 4 4"
          >
            <path d="M 0 0 L 4 2 L 0 4 z" fill={DONE_LINK_COLOR} />
          </marker>
        </defs>
        <g ref={gNodeAndLinkRef}>
          <g ref={gLinkRef}>
            {tree.links
              ?.filter((link) => link?.uuid)
              .map((link) => (
                <line key={link.uuid} markerEnd="url(#arrow)" strokeWidth={1} />
              ))}
          </g>
          <g ref={gNodeRef}>
            {tree.nodes
              ?.filter((node) => node?.uuid)
              .map((node) => {
                const doneTimestamp = doneNodeTimestamps[node.uuid];
                const nodeTitle = doneTimestamp
                  ? `${formatNodeTypeLabel(node.type)}: ${node.name}\nCompleted on ${doneTimestamp}`
                  : `${formatNodeTypeLabel(node.type)}: ${node.name}`;

                return (
                  <circle
                    className={
                      selectedNodeIds.includes(node.uuid) ? "selected" : ""
                    }
                    data-current={
                      currentNode && currentNode.uuid === node.uuid
                        ? "true"
                        : undefined
                    }
                    data-done={
                      doneNodeIds.includes(node.uuid) ? "true" : undefined
                    }
                    data-study={
                      markedForStudyNodeIds.includes(node.uuid)
                        ? "true"
                        : undefined
                    }
                    key={node.uuid}
                    // Closure captures node.uuid to pass to click handler
                    onClick={() => onNodeClick(node.uuid)}
                    onTouchEnd={onNodeTouchEnd}
                    onTouchStart={onNodeTouchStart}
                    strokeWidth={1.5}
                  >
                    <title>{nodeTitle}</title>
                    {currentNode && currentNode?.uuid === node.uuid && (
                      <animate
                        key={`animate-${node.uuid}`}
                        attributeName="r"
                        begin="0s"
                        dur="1.5s"
                        repeatCount="indefinite"
                        values={
                          currentNode?.type === "skill"
                            ? `${MINOR_RADIUS};${MINOR_RADIUS * 2};${MINOR_RADIUS}`
                            : `${MINOR_RADIUS};${MINOR_RADIUS * 2};${MINOR_RADIUS}`
                        }
                      />
                    )}
                  </circle>
                );
              })}
          </g>
        </g>
      </svg>
    </div>
  );
}
