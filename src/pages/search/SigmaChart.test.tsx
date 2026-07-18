import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Tree } from "../../types/types";
import SigmaChart from "./SigmaChart";

const sigmaInstances: Array<{
  handlers: Record<string, (...args: unknown[]) => void>;
}> = [];

vi.mock("sigma", () => {
  /**
   *
   */
  class MockSigma {
    handlers: Record<string, (...args: unknown[]) => void> = {};

    /**
     *
     */
    constructor() {
      sigmaInstances.push(this);
    }

    /**
     *
     */
    getCamera() {
      return {
        setState: vi.fn(),
      };
    }

    /**
     *
     */
    kill() {}

    /**
     *
     */
    on(event: string, handler: (...args: unknown[]) => void) {
      this.handlers[event] = handler;
      return this;
    }
  }

  return { default: MockSigma };
});

const TREE: Tree = {
  links: [{ source: "skill-1", target: "url-1", uuid: "edge-1" }],
  nodes: [
    {
      embedding: [0.2, 0.6, 0.2],
      name: "Skill 1",
      type: "skill",
      uuid: "skill-1",
    },
    {
      embedding: [0.6, 0.2, 0.2],
      name: "https://example.com",
      type: "url",
      uuid: "url-1",
    },
  ],
};

afterEach(() => {
  sigmaInstances.length = 0;
});

describe("SigmaChart", () => {
  it("exposes renderer-neutral node and edge markers", () => {
    render(
      <SigmaChart
        currentNode={TREE.nodes[0]}
        doneLinkIds={["edge-1"]}
        doneNodeIds={["skill-1"]}
        doneNodeTimestamps={{ "skill-1": "2026-07-12T12:00:00Z" }}
        markedForStudyNodeIds={["url-1"]}
        pathTree={TREE}
        selectedNodeIds={["skill-1"]}
        tree={TREE}
      />,
    );

    const observability = screen.getByTestId("sigma-observability");
    expect(observability).toBeInTheDocument();

    const nodeMarkers = screen.getByTestId("sigma-nodes");
    const edgeMarkers = screen.getByTestId("sigma-edges");

    expect(nodeMarkers.querySelectorAll("[data-node-id]")).toHaveLength(2);
    expect(edgeMarkers.querySelectorAll("[data-edge-id]")).toHaveLength(1);

    const skillMarker = nodeMarkers.querySelector('[data-node-id="skill-1"]');
    expect(skillMarker?.getAttribute("data-done")).toBe("true");
    expect(skillMarker?.getAttribute("data-label")).toBe(
      "Skill: Skill 1\nCompleted on 2026-07-12T12:00:00Z",
    );

    const edgeMarker = edgeMarkers.querySelector('[data-edge-id="edge-1"]');
    expect(edgeMarker?.getAttribute("data-done")).toBe("true");
    expect(edgeMarker?.getAttribute("data-in-path")).toBe("true");
  });

  it("maps Sigma click events to the node click callback", () => {
    const onNodeClick = vi.fn();

    render(<SigmaChart onNodeClick={onNodeClick} tree={TREE} />);

    expect(sigmaInstances).toHaveLength(1);
    sigmaInstances[0].handlers.clickNode({ node: "skill-1" });

    expect(onNodeClick).toHaveBeenCalledWith("skill-1");
  });
});
