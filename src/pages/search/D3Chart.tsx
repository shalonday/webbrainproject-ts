import * as d3 from "d3";
import { useEffect, useRef } from "react";

import type { Link, Tree, WBNode } from "../../types/types";

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

const RADIUS = 7;
const MINOR_RADIUS = RADIUS / 2;
//const ACTIVE_SKILL_FILL = "hsl(315 100% 60%)";
const INACTIVE_SKILL_FILL = "hsl(240 100% 30%)";
//const ACTIVE_MODULE_FILL = "hsl(180 100% 50%)";
const INACTIVE_MODULE_FILL = "hsl(60 10% 20%)";
//const ACTIVE_LINK_COLOR = "hsl(180 100% 50%)";
const INACTIVE_LINK_COLOR = "hsl(60 10% 20%)";

interface D3ChartProps {
  currentNode?: WBNode | null;
  onNodeClick?: (event: React.MouseEvent<SVGCircleElement>) => void;
  onNodeTouchEnd?: (event: React.TouchEvent<SVGCircleElement>) => void;
  onNodeTouchStart?: (event: React.TouchEvent<SVGCircleElement>) => void;
  selectedNodeIds?: string[];
  tree: Tree;
}

/**
 * Creates and manages a D3 force-directed graph simulation.
 * Sets up node and link rendering with forces for positioning, charge repulsion, and centering.
 * Handles visual styling for active/inactive states and different node types.
 *
 * @param data - The tree data containing nodes and links to visualize.
 * @param svgRef - Reference to the SVG element containing the graph.
 * @param gNodeAndLinkRef - Reference to the group element containing all nodes and links.
 * @param gLinkRef - Reference to the group element containing link elements.
 * @param gNodeRef - Reference to the group element containing node elements.
 * @param viewBoxWidth - Width of the SVG viewBox, defaults to 400.
 * @param viewBoxHeight - Height of the SVG viewBox, defaults to 400.
 */
function ForceGraph(
  data: Tree,
  gNodeAndLinkRef: React.RefObject<SVGGElement | null>,
  gLinkRef: React.RefObject<SVGGElement | null>,
  gNodeRef: React.RefObject<SVGGElement | null>,
  viewBoxWidth = 400,
  viewBoxHeight = 400
  // onNodeClick,
  // onNodeTouchStart,
  // onNodeTouchEnd
) {
  // Specify the dimensions of the chart.

  // The force simulation mutates links and nodes, so create a copy
  // so that re-evaluating this cell produces the same result.
  const links = data.links.map((d) => ({ ...d }));
  const nodes = data.nodes.map((d) => ({ ...d })) as SimulatedWBNode[];

  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink<SimulatedWBNode, (typeof links)[0]>(links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody().strength(-30))
    .force("x", d3.forceX(viewBoxWidth / 2))
    .force("y", d3.forceY(viewBoxHeight / 2))
    .on("tick", ticked);

  const link = d3
    .select(gLinkRef.current)
    .selectAll<SVGLineElement, LinkDatum>("line")
    .data(links)
    .attr("stroke", INACTIVE_LINK_COLOR)
    // .attr("stroke", (d) => {
    //   if (!d.active) return INACTIVE_LINK_COLOR;
    //   else if (d.active) return ACTIVE_LINK_COLOR;
    // })
    .attr("marker-end", (d) => `url(#arrow-${d.id})`);

  d3.select(gLinkRef.current)
    .selectAll<SVGMarkerElement, LinkDatum>("marker")
    .data(links)
    .attr("fill", INACTIVE_LINK_COLOR);
  // .attr("fill", (d) => {
  //   if (!d.active) return INACTIVE_LINK_COLOR;
  //   else if (d.active) {
  //     return ACTIVE_LINK_COLOR;
  //   }
  // });

  const node = d3
    .select(gNodeRef.current)
    .selectAll<SVGCircleElement, SimulatedWBNode>("circle")
    .data(nodes)
    .attr("r", (d) =>
      d.type === "skill" || d.type === "url" ? RADIUS : MINOR_RADIUS
    )
    .attr("fill", (d) => {
      if (d.type === "skill") {
        return INACTIVE_SKILL_FILL;
        // return d.active ? ACTIVE_SKILL_FILL : INACTIVE_SKILL_FILL;
      } else if (d.type === "url") {
        return INACTIVE_MODULE_FILL;
        // return d.active ? ACTIVE_MODULE_FILL : INACTIVE_MODULE_FILL;
      }
      return INACTIVE_SKILL_FILL;
    })
    .attr("stroke", "black")
    .call(drag(simulation));

  /**
   * Updates the positions of nodes and links on each simulation tick.
   * Called automatically by the D3 force simulation to animate the graph.
   */
  function ticked() {
    link
      .attr("x1", (d) => (isSimulatedNode(d.source) ? d.source.x ?? 0 : 0))
      .attr("y1", (d) => (isSimulatedNode(d.source) ? d.source.y ?? 0 : 0))
      .attr("x2", (d) => (isSimulatedNode(d.target) ? d.target.x ?? 0 : 0))
      .attr("y2", (d) => (isSimulatedNode(d.target) ? d.target.y ?? 0 : 0));

    node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
  }

  //   /**
  //    * Applies zoom and pan transformations to the graph.
  //    *
  //    * @param params - Object containing the transform.
  //    * @param params.transform - The D3 zoom transform to apply.
  //    */
  //   function zoomed({ transform }: { transform: d3.ZoomTransform }) {
  //     const gNodesAndLinks = d3.select(gNodeAndLinkRef.current);
  //     gNodesAndLinks.attr("transform", transform);
  //   }

  /**
   * Creates a drag behavior for graph nodes.
   * Allows nodes to be interactively dragged while maintaining the force simulation.
   * Based on: https://observablehq.com/@d3/force-directed-graph-component
   *
   * @param simulation - The D3 force simulation managing the graph layout.
   * @returns A D3 drag behavior to attach to node elements.
   */
  function drag(
    simulation: d3.Simulation<
      SimulatedWBNode,
      d3.SimulationLinkDatum<SimulatedWBNode>
    >
  ) {
    /**
     *
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
     *
     */
    function dragged(
      event: d3.D3DragEvent<SVGCircleElement, SimulatedWBNode, SimulatedWBNode>
    ) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    /**
     *
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

  useEffect(() => {
    const viewBoxWidth = svgContainerRef.current?.clientWidth;
    const viewBoxHeight = svgContainerRef.current?.clientHeight;

    ForceGraph(
      tree,
      gNodeAndLinkRef,
      gLinkRef,
      gNodeRef,
      viewBoxWidth,
      viewBoxHeight
    );
  }, [tree]); // that viewBoxWidth and Height are here is probs the reason the chart always restarts when I click stuff

  return (
    <div
      ref={svgContainerRef}
      style={{ height: "85vh", width: "100vw" }}
    >
      <svg
        ref={svgRef}
        style={{ height: "100%", width: "100%" }}
        viewBox="0 0 400 400"
      >
        <g ref={gNodeAndLinkRef}>
          <g ref={gLinkRef}>
            {tree.links.map((link) => (
              <marker
                id="arrow"
                key={`m${link.id}`}
                markerHeight="3"
                markerWidth="3"
                orient="auto-start-reverse"
                refX="15"
                refY="5"
                viewBox="0 0 10 10"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            ))}
            {tree.links.map((link) => (
              <line key={link.id} markerEnd="url(#arrow)" strokeWidth={1.5} />
            ))}
          </g>
          <g ref={gNodeRef}>
            {tree.nodes.map((node) => (
              <circle
                className={selectedNodeIds.includes(node.id) ? "selected" : ""}
                key={node.id}
                onClick={onNodeClick}
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
