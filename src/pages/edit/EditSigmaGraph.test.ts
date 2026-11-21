import { describe, expect, it } from "vitest";

import type { AnalyzeResponse } from "../../types/types";
import { createAnalyzeResponseTree } from "./createAnalyzeResponseTree";
import { createEditSigmaGraph } from "./createEditSigmaGraph";

const ANALYZE_RESPONSE: AnalyzeResponse = {
  content: "Lesson content",
  objectives: [
    { name: "Functions", uuid: null },
    { name: "Advanced functions", uuid: "existing-objective-id" },
  ],
  prerequisites: [
    { name: "Variables", uuid: "existing-prerequisite-id" },
    { name: "Basic algebra", uuid: null },
  ],
  title: "Lesson",
  url: "https://example.com/lesson",
};

describe("createAnalyzeResponseTree", () => {
  it("creates URL and skill nodes using the shared tree schema", () => {
    const tree = createAnalyzeResponseTree(ANALYZE_RESPONSE);
    const urlNode = tree.nodes.find((node) => node.type === "url");

    expect(urlNode).toMatchObject({
      name: "https://example.com/lesson",
      type: "url",
    });
    expect(urlNode?.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(tree.nodes.filter((node) => node.type === "skill")).toStrictEqual([
      {
        name: "Variables",
        type: "skill",
        uuid: "existing-prerequisite-id",
      },
      {
        name: "Basic algebra",
        type: "skill",
        uuid: "candidate-skill:Basic%20algebra",
      },
      {
        name: "Functions",
        type: "skill",
        uuid: "candidate-skill:Functions",
      },
      {
        name: "Advanced functions",
        type: "skill",
        uuid: "existing-objective-id",
      },
    ]);
  });

  it("links prerequisites to the URL and the URL to objectives", () => {
    const tree = createAnalyzeResponseTree(ANALYZE_RESPONSE);
    const urlId = tree.nodes.find((node) => node.type === "url")?.uuid;
    expect(urlId).toBeDefined();

    expect(
      tree.links.map(({ source, target }) => [source, target]),
    ).toStrictEqual([
      ["existing-prerequisite-id", urlId],
      ["candidate-skill:Basic%20algebra", urlId],
      [urlId, "candidate-skill:Functions"],
      [urlId, "existing-objective-id"],
    ]);
    expect(new Set(tree.links.map(({ uuid }) => uuid)).size).toBe(4);
    expect(
      tree.links.every(({ uuid }) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          uuid,
        ),
      ),
    ).toBe(true);
  });

  it("deduplicates repeated skill names and links", () => {
    const tree = createAnalyzeResponseTree({
      ...ANALYZE_RESPONSE,
      objectives: [{ name: "Functions", uuid: null }],
      prerequisites: [
        { name: "Variables", uuid: "existing-prerequisite-id" },
        { name: "Variables", uuid: "existing-prerequisite-id" },
      ],
    });

    expect(tree.nodes).toHaveLength(3);
    expect(tree.links).toHaveLength(2);
  });
});

describe("createEditSigmaGraph", () => {
  it("converts an embedding-free analyzed tree into a positioned graph", () => {
    const tree = createAnalyzeResponseTree(ANALYZE_RESPONSE);
    const graph = createEditSigmaGraph(tree);
    const urlNode = tree.nodes.find((node) => node.type === "url");
    const prerequisiteLink = tree.links.find(
      (link) => link.target === urlNode?.uuid,
    );
    const objectiveLink = tree.links.find(
      (link) => link.source === urlNode?.uuid,
    );

    expect(urlNode).toBeDefined();
    expect(graph.order).toBe(tree.nodes.length);
    expect(graph.size).toBe(tree.links.length);
    expect(graph.getNodeAttributes(prerequisiteLink!.source).x).toBeLessThan(
      graph.getNodeAttributes(urlNode!.uuid).x,
    );
    expect(graph.getNodeAttributes(objectiveLink!.target).x).toBeGreaterThan(
      graph.getNodeAttributes(urlNode!.uuid).x,
    );
  });

  it("rejects a skill that is both a prerequisite and an objective", () => {
    expect(() =>
      createAnalyzeResponseTree({
        ...ANALYZE_RESPONSE,
        objectives: [{ name: "Shared skill", uuid: null }],
        prerequisites: [{ name: "Shared skill", uuid: null }],
      }),
    ).toThrow(
      'Skill "Shared skill" cannot be both a prerequisite and an objective',
    );
  });
});
