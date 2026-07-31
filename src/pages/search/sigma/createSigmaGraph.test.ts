import { describe, expect, it } from "vitest";

import {
  ACTIVE_LINK_COLOR,
  DONE_LINK_COLOR,
  MARKED_FOR_STUDY_FILL,
} from "../../../common-constants";
import type { Tree } from "../../../types/types";
import { createSigmaGraph } from "./createSigmaGraph";

const TREE: Tree = {
  links: [
    {
      source: "node-skill-a",
      target: "node-url-a",
      uuid: "edge-a",
    },
    {
      source: "node-url-a",
      target: "node-skill-b",
      uuid: "edge-b",
    },
  ],
  nodes: [
    {
      embedding: [0.1, 0.7, 0.2],
      name: "Skill B",
      type: "skill",
      uuid: "node-skill-b",
    },
    {
      embedding: [0.2, 0.1, 0.7],
      name: "URL A",
      type: "url",
      uuid: "node-url-a",
    },
    {
      embedding: [0.8, 0.1, 0.1],
      name: "Skill A",
      type: "skill",
      uuid: "node-skill-a",
    },
  ],
};

describe("createSigmaGraph", () => {
  it("preserves node and edge UUIDs as graph keys", () => {
    const graph = createSigmaGraph({ tree: TREE });

    expect(graph.hasNode("node-skill-a")).toBe(true);
    expect(graph.hasNode("node-url-a")).toBe(true);
    expect(graph.hasNode("node-skill-b")).toBe(true);

    expect(graph.hasEdge("edge-a")).toBe(true);
    expect(graph.hasEdge("edge-b")).toBe(true);

    expect(graph.source("edge-a")).toBe("node-skill-a");
    expect(graph.target("edge-a")).toBe("node-url-a");
  });

  it("produces deterministic graph structure and coordinates", () => {
    const graphA = createSigmaGraph({ tree: TREE });
    const graphB = createSigmaGraph({ tree: TREE });

    expect(graphA.export()).toStrictEqual(graphB.export());
  });

  it("attaches style-relevant node and edge attributes", () => {
    const graph = createSigmaGraph({
      currentNode: TREE.nodes[2],
      doneLinkIds: ["edge-b"],
      doneNodeIds: ["node-url-a"],
      doneNodeTimestamps: {
        "node-url-a": "2026-07-05T16:00:00.000Z",
      },
      markedForStudyNodeIds: ["node-skill-b"],
      pathTree: {
        links: [TREE.links[0]],
        nodes: [TREE.nodes[2], TREE.nodes[1]],
      },
      selectedNodeIds: ["node-skill-a"],
      tree: TREE,
    });

    const doneNode = graph.getNodeAttributes("node-url-a");
    const selectedNode = graph.getNodeAttributes("node-skill-a");
    const markedForStudyNode = graph.getNodeAttributes("node-skill-b");
    const doneEdge = graph.getEdgeAttributes("edge-b");
    const inPathEdge = graph.getEdgeAttributes("edge-a");

    expect(doneNode.isDone).toBe(true);
    expect(doneNode.doneTimestamp).toBe("2026-07-05T16:00:00.000Z");
    expect(doneNode.type).toBe("circle");
    expect(doneNode.wbType).toBe("url");

    expect(selectedNode.isSelected).toBe(true);
    expect(selectedNode.isCurrent).toBe(true);
    expect(selectedNode.type).toBe("circle");
    expect(selectedNode.wbType).toBe("skill");

    expect(markedForStudyNode.isMarkedForStudy).toBe(true);
    expect(markedForStudyNode.color).toBe(MARKED_FOR_STUDY_FILL);
    expect(markedForStudyNode.type).toBe("circle");
    expect(markedForStudyNode.wbType).toBe("skill");

    expect(doneEdge.isDone).toBe(true);
    expect(doneEdge.color).toBe(DONE_LINK_COLOR);

    expect(inPathEdge.isInPath).toBe(true);
    expect(inPathEdge.color).toBe(ACTIVE_LINK_COLOR);
  });
});
