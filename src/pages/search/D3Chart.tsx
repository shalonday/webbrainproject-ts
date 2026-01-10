import * as d3 from "d3";
import { useEffect, useRef } from "react";

import {
  ACTIVE_MODULE_FILL,
  ACTIVE_SKILL_FILL,
  INACTIVE_LINK_COLOR,
  INACTIVE_MODULE_FILL,
  INACTIVE_SKILL_FILL,
  MINOR_RADIUS,
  RADIUS,
} from "../../common-constants";
import type { Link, Tree, WBNode } from "../../types/types";

// Vitest sets NODE_ENV="test" automatically; Vite sets it for dev/prod builds
const IS_TEST_ENV = import.meta.env.MODE === "test";

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
 * Determines the fill color for a node based on its type and selection state.
 *
 * @param node - The node to style.
 * @param selectedIds - Array of selected node IDs.
 * @returns The appropriate fill color.
 */
function getNodeFill(node: SimulatedWBNode, selectedIds: string[]): string {
  const isSelected = selectedIds.includes(node.id);
  if (node.type === "skill") {
    return isSelected ? ACTIVE_SKILL_FILL : INACTIVE_SKILL_FILL;
  }
  if (node.type === "url") {
    return isSelected ? ACTIVE_MODULE_FILL : INACTIVE_MODULE_FILL;
  }
  return INACTIVE_SKILL_FILL;
}

interface D3ChartProps {
  currentNode?: WBNode | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeTouchEnd?: (event: React.TouchEvent<SVGCircleElement>) => void;
  onNodeTouchStart?: (event: React.TouchEvent<SVGCircleElement>) => void;
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

/**
 * Attaches pan/zoom behavior to the SVG and applies transforms to the graph group.
 */
function setupZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  gNodeAndLinkRef: React.RefObject<SVGGElement | null>
) {
  if (IS_TEST_ENV || typeof document === "undefined" || !svgRef.current) {
    return;
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
  ticked: () => void
) {
  return d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink<SimulatedWBNode, (typeof links)[0]>(links).id((d) => d.id)
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
 * @returns D3 selection of rendered line elements for further manipulation.
 */
function renderLinks(
  gLinkRef: React.RefObject<SVGGElement | null>,
  links: LinkDatum[]
): LinkSelection {
  return d3
    .select(gLinkRef.current)
    .selectAll<SVGLineElement, LinkDatum>("line")
    .data(links)
    .attr("stroke", INACTIVE_LINK_COLOR)
    .attr("marker-end", "url(#arrow)");
}
/**
 * Updates node fill colors based on selection state.
 * Called when selectedNodeIds changes without recreating the simulation.
 *
 * @param gNodeRef - Reference to the SVG group containing node elements.
 * @param selectedNodeIds - Array of selected node IDs for styling.
 */
function updateNodeColors(
  gNodeRef: React.RefObject<SVGGElement | null>,
  selectedNodeIds: string[]
) {
  d3.select(gNodeRef.current)
    .selectAll<SVGCircleElement, SimulatedWBNode>("circle")
    .attr("fill", (d) => getNodeFill(d, selectedNodeIds));
}

/**
 * Renders node circles with styling and drag behavior.
 * Applies radius and fill based on node type (skill/url) and selection state.
 *
 * @param gNodeRef - Reference to the SVG group containing node elements.
 * @param nodes - Array of nodes to render.
 * @param selectedNodeIds - Array of selected node IDs for styling.
 * @param simulation - Force simulation for drag interaction.
 * @returns D3 selection of rendered circle elements.
 */
function renderNodes(
  gNodeRef: React.RefObject<SVGGElement | null>,
  nodes: SimulatedWBNode[],
  selectedNodeIds: string[],
  simulation: d3.Simulation<
    SimulatedWBNode,
    d3.SimulationLinkDatum<SimulatedWBNode>
  >
): NodeSelection {
  return d3
    .select(gNodeRef.current)
    .selectAll<SVGCircleElement, SimulatedWBNode>("circle")
    .data(nodes)
    .attr("r", (d) =>
      d.type === "skill" || d.type === "url" ? RADIUS : MINOR_RADIUS
    )
    .attr("fill", (d) => getNodeFill(d, selectedNodeIds))
    .attr("stroke", "black")
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
  >
) {
  /**
   * Handles drag start: pins node and restarts simulation.
   */
  function dragstarted(
    event: d3.D3DragEvent<SVGCircleElement, SimulatedWBNode, SimulatedWBNode>
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
    event: d3.D3DragEvent<SVGCircleElement, SimulatedWBNode, SimulatedWBNode>
  ) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  /**
   * Handles drag end: releases node and cools simulation.
   */
  function dragended(
    event: d3.D3DragEvent<SVGCircleElement, SimulatedWBNode, SimulatedWBNode>
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
    .attr("x1", (d) => (isSimulatedNode(d.source) ? d.source.x ?? 0 : 0))
    .attr("y1", (d) => (isSimulatedNode(d.source) ? d.source.y ?? 0 : 0))
    .attr("x2", (d) => (isSimulatedNode(d.target) ? d.target.x ?? 0 : 0))
    .attr("y2", (d) => (isSimulatedNode(d.target) ? d.target.y ?? 0 : 0));

  node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
}

/**
 * Orchestrates the D3 force-directed graph setup and rendering.
 * Creates simulation, renders nodes/links, and wires update callbacks.
 *
 * @param data - Tree data containing nodes and links.
 * @param selectedNodeIds - Array of selected node IDs for styling.
 * @param gNodeAndLinkRef - Reference to the main SVG group.
 * @param gLinkRef - Reference to the links SVG group.
 * @param gNodeRef - Reference to the nodes SVG group.
 * @param viewBoxWidth - Width for center-force positioning, defaults to 400.
 * @param viewBoxHeight - Height for center-force positioning, defaults to 400.
 */
function ForceGraph(
  data: Tree,
  selectedNodeIds: string[],
  gNodeAndLinkRef: React.RefObject<SVGGElement | null>,
  gLinkRef: React.RefObject<SVGGElement | null>,
  gNodeRef: React.RefObject<SVGGElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
  viewBoxWidth = 400,
  viewBoxHeight = 400
) {
  // The force simulation mutates links and nodes, so create a copy
  // so that re-evaluating this cell produces the same result.
  const links = data.links.map((d) => ({ ...d }));
  const nodes = data.nodes.map((d) => ({ ...d })) as SimulatedWBNode[];

  const linkSelection = renderLinks(gLinkRef, links);

  const nodeSelection = renderNodes(
    gNodeRef,
    nodes,
    selectedNodeIds,
    createSimulation(nodes, links, viewBoxWidth, viewBoxHeight, () =>
      updatePositions(linkSelection, nodeSelection)
    )
  );

  setupZoom(svgRef, gNodeAndLinkRef);
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
  selectedNodeIds = [],
  currentNode = null,
}: D3ChartProps) {
  const gLinkRef = useRef<SVGGElement>(null);
  const gNodeRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gNodeAndLinkRef = useRef<SVGGElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Create simulation only when tree data changes
  useEffect(() => {
    const viewBoxWidth = svgContainerRef.current?.clientWidth;
    const viewBoxHeight = svgContainerRef.current?.clientHeight;

    ForceGraph(
      tree,
      selectedNodeIds,
      gNodeAndLinkRef,
      gLinkRef,
      gNodeRef,
      svgRef,
      viewBoxWidth,
      viewBoxHeight
    );
    // selectedNodeIds intentionally excluded: color updates handled by separate effect
    // Refs are stable and don't need to be dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  // Update node colors when selection changes without recreating simulation
  useEffect(() => {
    updateNodeColors(gNodeRef, selectedNodeIds);
  }, [selectedNodeIds]);

  return (
    <div ref={svgContainerRef} style={{ height: "85vh", width: "100vw" }}>
      <svg
        ref={svgRef}
        style={{ height: "100%", width: "100%" }}
        viewBox="0 0 400 400"
      >
        <defs>
          <marker
            id="arrow"
            markerHeight="10"
            markerUnits="strokeWidth"
            markerWidth="8"
            orient="auto"
            refX="10"
            refY="5"
            viewBox="0 0 10 10"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={INACTIVE_LINK_COLOR} />
          </marker>
        </defs>
        <g ref={gNodeAndLinkRef}>
          <g ref={gLinkRef}>
            {tree.links.map((link) => (
              <line key={link.id} markerEnd="url(#arrow)" strokeWidth={1.5} />
            ))}
          </g>
          <g ref={gNodeRef}>
            {tree.nodes.map((node) => (
              <circle
                className={selectedNodeIds.includes(node.id) ? "selected" : ""}
                key={node.id}
                // Closure captures node.id to pass to click handler
                onClick={() => onNodeClick(node.id)}
                onTouchEnd={onNodeTouchEnd}
                onTouchStart={onNodeTouchStart}
                strokeWidth={1.5}
              >
                {currentNode && currentNode?.id === node.id ? (
                  <>
                    <animate
                      attributeName="r"
                      begin="0s"
                      dur="1.5s"
                      repeatCount="indefinite"
                      values={
                        currentNode?.type === "skill"
                          ? `${MINOR_RADIUS};${
                              MINOR_RADIUS * 2
                            };${MINOR_RADIUS}`
                          : `${MINOR_RADIUS};${
                              MINOR_RADIUS * 2
                            };${MINOR_RADIUS}`
                      }
                    />
                  </>
                ) : null}
              </circle>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
