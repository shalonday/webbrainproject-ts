import { describe, expect, it } from "vitest";

import { PerkAPIClient } from "../api/perkClient";
import { BASE_URL } from "../common-constants";

describe("PerkAPIClient", () => {
  it("should search by similarity", async () => {
    const client = new PerkAPIClient(BASE_URL);
    const results = await client.searchBySimilarity("javascript");
    expect(results).toHaveLength(2);
    expect(results[0].node.name).toBe("JavaScript Basics");
  });

  it("should analyze a URL for ingestion", async () => {
    const client = new PerkAPIClient(BASE_URL);
    const response = await client.analyzeUrl("https://example.com/lesson");

    expect(response).toEqual({
      url: "https://example.com/lesson",
      title: "Mock page title",
      content: "Mock page content",
      prerequisites: [],
      objectives: [],
    });
  });
});
