import { describe, expect, it } from "vitest";

import { generateSessionId, isValidNodeId } from "../utils/common";

describe("common utilities", () => {
  it("should generate unique session IDs", () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    expect(id1).toMatch(/^session_/);
    expect(id2).toMatch(/^session_/);
    expect(id1).not.toBe(id2);
  });

  it("should validate node IDs", () => {
    expect(isValidNodeId("skill_1")).toBe(false);
    expect(isValidNodeId("")).toBe(false);
    expect(isValidNodeId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });
});
