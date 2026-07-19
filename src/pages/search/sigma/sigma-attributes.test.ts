import { describe, expect, it } from "vitest";

import {
  ACTIVE_MODULE_FILL,
  ACTIVE_SKILL_FILL,
  DONE_SKILL_FILL,
  MARKED_FOR_STUDY_FILL,
} from "../../../common-constants";
import type { Tree, WBNode } from "../../../types/types";
import {
  getSigmaEdgeAttributes,
  getSigmaNodeAttributes,
} from "./sigma-attributes";
import { buildDeterministicForceLayoutPositions } from "./sigma-force-layout.ts";

const SKILL_NODE: WBNode = {
  name: "Skill",
  type: "skill",
  uuid: "skill-1",
};

const URL_NODE: WBNode = {
  name: "Module",
  type: "url",
  uuid: "url-1",
};

const PATH_TREE: Tree = {
  links: [
    {
      source: "skill-1",
      target: "url-1",
      uuid: "edge-1",
    },
  ],
  nodes: [SKILL_NODE, URL_NODE],
};

const MAX_CENTER_DISTANCE = 1000;
const MAX_LINKED_DISTANCE = 5000;

describe("sigma-attributes", () => {
  it("projects embeddings into deterministic 2D positions", () => {
    const positions = buildDeterministicForceLayoutPositions([
      { embedding: [1, 0, 0], name: "A", type: "skill", uuid: "a" },
      { embedding: [0, 1, 0], name: "B", type: "skill", uuid: "b" },
      { embedding: [0, 0, 1], name: "C", type: "url", uuid: "c" },
    ]);

    const centerDistance = Math.hypot(positions.a.x, positions.a.y);
    const linkedDistance = Math.hypot(
      positions.a.x - positions.b.x,
      positions.a.y - positions.b.y,
    );

    expect(positions).toStrictEqual(
      buildDeterministicForceLayoutPositions([
        { embedding: [1, 0, 0], name: "A", type: "skill", uuid: "a" },
        { embedding: [0, 1, 0], name: "B", type: "skill", uuid: "b" },
        { embedding: [0, 0, 1], name: "C", type: "url", uuid: "c" },
      ]),
    );
    expect(centerDistance).toBeLessThan(MAX_CENTER_DISTANCE);
    expect(linkedDistance).toBeLessThan(MAX_LINKED_DISTANCE);
  });

  it("throws when embeddings are missing", () => {
    expect(() =>
      buildDeterministicForceLayoutPositions([
        { name: "A", type: "skill", uuid: "a" },
        { name: "B", type: "skill", uuid: "b" },
        { name: "C", type: "url", uuid: "c" },
      ]),
    ).toThrow("Sigma layout requires embeddings on every node");
  });

  it("keeps node color priority done > selected > study > inactive", () => {
    const doneAttrs = getSigmaNodeAttributes(
      SKILL_NODE,
      { x: 0, y: 0 },
      {
        doneNodeIds: ["skill-1"],
        markedForStudyNodeIds: ["skill-1"],
        selectedNodeIds: ["skill-1"],
      },
    );

    const selectedAttrs = getSigmaNodeAttributes(
      URL_NODE,
      { x: 0, y: 0 },
      {
        selectedNodeIds: ["url-1"],
      },
    );

    const studyAttrs = getSigmaNodeAttributes(
      SKILL_NODE,
      { x: 0, y: 0 },
      {
        markedForStudyNodeIds: ["skill-1"],
      },
    );

    expect(doneAttrs.color).toBe(DONE_SKILL_FILL);
    expect(selectedAttrs.color).toBe(ACTIVE_MODULE_FILL);
    expect(studyAttrs.color).toBe(MARKED_FOR_STUDY_FILL);
  });

  it("keeps edge color priority done > in-path > inactive", () => {
    const doneEdge = getSigmaEdgeAttributes(
      {
        source: "skill-1",
        target: "url-1",
        uuid: "edge-1",
      },
      {
        doneLinkIds: ["edge-1"],
        pathTree: PATH_TREE,
      },
    );

    const inPathEdge = getSigmaEdgeAttributes(
      {
        source: "skill-1",
        target: "url-1",
        uuid: "edge-1",
      },
      {
        pathTree: PATH_TREE,
      },
    );

    expect(doneEdge.isDone).toBe(true);
    expect(doneEdge.color).not.toBe(inPathEdge.color);
    expect(inPathEdge.isInPath).toBe(true);
  });

  it("sets metadata flags needed for later style updates", () => {
    const attrs = getSigmaNodeAttributes(
      SKILL_NODE,
      { x: 10, y: 20 },
      {
        currentNode: SKILL_NODE,
        doneNodeTimestamps: { "skill-1": "2026-07-05T17:00:00.000Z" },
        selectedNodeIds: ["skill-1"],
      },
    );

    expect(attrs.isCurrent).toBe(true);
    expect(attrs.isSelected).toBe(true);
    expect(attrs.doneTimestamp).toBe("2026-07-05T17:00:00.000Z");
    expect(attrs.x).toBe(10);
    expect(attrs.y).toBe(20);
    expect(attrs.color).toBe(ACTIVE_SKILL_FILL);
  });

  it("separates Sigma program type from WB domain node type", () => {
    const skillAttrs = getSigmaNodeAttributes(SKILL_NODE, { x: 0, y: 0 }, {});

    const urlAttrs = getSigmaNodeAttributes(URL_NODE, { x: 0, y: 0 }, {});

    expect(skillAttrs.type).toBe("circle");
    expect(urlAttrs.type).toBe("circle");
    expect(skillAttrs.wbType).toBe("skill");
    expect(urlAttrs.wbType).toBe("url");
  });
});
