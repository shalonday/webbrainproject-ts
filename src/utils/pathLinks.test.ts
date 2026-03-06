import { describe, expect, it } from "vitest";

import { DEFAULT_START_NODE_ID } from "../constants/graph";
import { buildPathLink, buildResultLinks } from "./pathLinks";

describe("pathLinks", () => {
  it("should build path link with start and end IDs", () => {
    const link = buildPathLink(
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    );
    expect(link).toBe(
      "/paths/550e8400-e29b-41d4-a716-446655440000/6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    );
  });

  it("should build path link with default start when only end ID provided", () => {
    const link = buildPathLink("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
    expect(link).toBe(
      `/paths/${encodeURIComponent(DEFAULT_START_NODE_ID)}/6ba7b810-9dad-11d1-80b4-00c04fd430c8`,
    );
  });

  it("should build result links with default start node", () => {
    const results = [
      {
        node: {
          uuid: "550e8400-e29b-41d4-a716-446655440000",
          name: "JavaScript Basics",
        },
        similarity: 0.95,
      },
      {
        node: {
          uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          name: "React Fundamentals",
        },
        similarity: 0.87,
      },
    ];

    const links = buildResultLinks(results);
    expect(links).toHaveLength(2);
    expect(links[0].link).toBe(
      `/paths/${encodeURIComponent(DEFAULT_START_NODE_ID)}/550e8400-e29b-41d4-a716-446655440000`,
    );
    expect(links[1].link).toBe(
      `/paths/${encodeURIComponent(DEFAULT_START_NODE_ID)}/6ba7b810-9dad-11d1-80b4-00c04fd430c8`,
    );
  });

  it("should build result links with custom start node", () => {
    const results = [
      {
        node: {
          uuid: "550e8400-e29b-41d4-a716-446655440000",
          name: "JavaScript Basics",
        },
        similarity: 0.95,
      },
    ];

    const links = buildResultLinks(
      results,
      "7cb7b811-9dad-11d1-80b4-00c04fd430c8",
    );
    expect(links[0].link).toBe(
      "/paths/7cb7b811-9dad-11d1-80b4-00c04fd430c8/550e8400-e29b-41d4-a716-446655440000",
    );
  });
});
