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
});
