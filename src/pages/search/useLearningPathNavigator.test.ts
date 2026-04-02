import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Tree } from "../../types/types";
import {
  getLocalProgress,
  saveLocalProgress,
} from "../../utils/progressStorage";
import { DEFAULT_START_NODE_ID } from "./search-utils";
import { useLearningPathNavigator } from "./useLearningPathNavigator";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A minimal 3-node path: Start Skill → URL → Learned Skill.
 * Start node UUID matches DEFAULT_START_NODE_ID so handleLandOnNode
 * skips the skill-modal for it.
 */
const MOCK_PATH_TREE: Tree = {
  nodes: [
    { uuid: DEFAULT_START_NODE_ID, type: "skill", name: "Start Skill" },
    { uuid: "url1", type: "url", name: "https://example.com/lesson" },
    { uuid: "skill2", type: "skill", name: "Learned Skill" },
  ],
  links: [
    { uuid: "link-start-url1", source: DEFAULT_START_NODE_ID, target: "url1" },
    { uuid: "link-url1-skill2", source: "url1", target: "skill2" },
  ],
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("open", vi.fn());
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PATH_TREE), // eslint-disable-line jsdoc/require-jsdoc
    }),
  );
});

/**
 * Render the hook with sensible defaults.
 */
function renderNavigator(overrides?: {
  selectedResultId?: string | null;
  universalTree?: Tree | null;
}) {
  return renderHook(() =>
    useLearningPathNavigator({
      universalTree: overrides?.universalTree ?? MOCK_PATH_TREE,
      selectedResultId: overrides?.selectedResultId ?? "skill2",
    }),
  );
}

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

describe("useLearningPathNavigator – hydration", () => {
  it("initializes done state from localStorage on mount", () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: { nodeA: "2026-01-01T00:00:00Z" },
      doneLinkTimestamps: { linkA: "2026-01-01T00:00:00Z" },
    });

    const { result } = renderNavigator();

    expect(result.current.doneNodeIds).toEqual(["nodeA"]);
    expect(result.current.doneLinkIds).toEqual(["linkA"]);
  });

  it("starts with empty done state when localStorage is empty", () => {
    const { result } = renderNavigator();

    expect(result.current.doneNodeIds).toEqual([]);
    expect(result.current.doneLinkIds).toEqual([]);
  });

  it("preserves hydrated done state through resetPath", () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: { nodeA: "2026-01-01T00:00:00Z" },
      doneLinkTimestamps: { linkA: "2026-01-01T00:00:00Z" },
    });

    const { result } = renderNavigator();

    act(() => {
      result.current.resetPath();
    });

    expect(result.current.doneNodeIds).toEqual(["nodeA"]);
    expect(result.current.doneLinkIds).toEqual(["linkA"]);
  });

  it("exposes hydrated timestamps in return value", () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: { nodeA: "2026-03-01T12:00:00Z" },
      doneLinkTimestamps: { linkA: "2026-03-01T12:30:00Z" },
    });

    const { result } = renderNavigator();

    expect(result.current.doneNodeTimestamps).toEqual({
      nodeA: "2026-03-01T12:00:00Z",
    });
    expect(result.current.doneLinkTimestamps).toEqual({
      linkA: "2026-03-01T12:30:00Z",
    });
  });
});

// ---------------------------------------------------------------------------
// Persistence on Move Forward
// ---------------------------------------------------------------------------

describe("useLearningPathNavigator – persistence on Move Forward", () => {
  it("writes progress to localStorage after Move Forward", async () => {
    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    expect(result.current.currentNodeId).toBe(DEFAULT_START_NODE_ID);

    act(() => {
      result.current.handleMoveForward();
    });

    const persisted = getLocalProgress();
    expect(persisted).not.toBeNull();
    expect(persisted!.doneNodeTimestamps).toHaveProperty(DEFAULT_START_NODE_ID);
    expect(persisted!.schemaVersion).toBe("1");
  });

  it("records ISO-8601 timestamps for newly done items", async () => {
    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    act(() => {
      result.current.handleMoveForward();
    });

    const persisted = getLocalProgress()!;
    const nodeTs = persisted.doneNodeTimestamps[DEFAULT_START_NODE_ID];
    expect(nodeTs).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("persists done link timestamps after Move Forward", async () => {
    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    act(() => {
      result.current.handleMoveForward();
    });

    const persisted = getLocalProgress()!;
    // Moving forward from the start skill marks the link to url1 as done
    expect(persisted.doneLinkTimestamps).toHaveProperty("link-start-url1");
  });

  it("accumulates done state across multiple Move Forward calls", async () => {
    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    // Move 1: start skill → url1
    act(() => {
      result.current.handleMoveForward();
    });

    // Move 2: url1 → skill2
    act(() => {
      result.current.handleMoveForward();
    });

    const persisted = getLocalProgress()!;
    expect(Object.keys(persisted.doneNodeTimestamps)).toContain(
      DEFAULT_START_NODE_ID,
    );
    expect(Object.keys(persisted.doneNodeTimestamps)).toContain("url1");
    expect(Object.keys(persisted.doneLinkTimestamps)).toContain(
      "link-start-url1",
    );
    expect(Object.keys(persisted.doneLinkTimestamps)).toContain(
      "link-url1-skill2",
    );
  });

  it("preserves markedForStudyNodeIds from hydrated state", async () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: {},
      doneLinkTimestamps: {},
      markedForStudyNodeIds: ["studyNode1"],
    });

    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    act(() => {
      result.current.handleMoveForward();
    });

    const persisted = getLocalProgress()!;
    expect(persisted.markedForStudyNodeIds).toContain("studyNode1");
  });
});

// ---------------------------------------------------------------------------
// Advance past done nodes on path generation
// ---------------------------------------------------------------------------

describe("useLearningPathNavigator – advance past done nodes", () => {
  it("starts at first undone node when start node is already done", async () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: { [DEFAULT_START_NODE_ID]: "2026-01-01T00:00:00Z" },
      doneLinkTimestamps: {},
    });

    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    // Should skip the done start node and land on url1
    expect(result.current.currentNodeId).toBe("url1");
  });

  it("skips multiple done nodes to reach the frontier", async () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: {
        [DEFAULT_START_NODE_ID]: "2026-01-01T00:00:00Z",
        url1: "2026-01-02T00:00:00Z",
      },
      doneLinkTimestamps: {
        "link-start-url1": "2026-01-01T00:00:00Z",
      },
    });

    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    // Both start node and url1 are done → should land on skill2
    expect(result.current.currentNodeId).toBe("skill2");
  });

  it("skips done nodes and lands on undone branch in branching path", async () => {
    // Branching path: START → [url1, url2], url1 → skillA, url2 → skillB
    const branchingTree: Tree = {
      nodes: [
        { uuid: DEFAULT_START_NODE_ID, type: "skill", name: "Start Skill" },
        { uuid: "url1", type: "url", name: "https://example.com/lesson1" },
        { uuid: "url2", type: "url", name: "https://example.com/lesson2" },
        { uuid: "skillA", type: "skill", name: "Skill A" },
        { uuid: "skillB", type: "skill", name: "Skill B" },
      ],
      links: [
        {
          uuid: "link-start-url1",
          source: DEFAULT_START_NODE_ID,
          target: "url1",
        },
        {
          uuid: "link-start-url2",
          source: DEFAULT_START_NODE_ID,
          target: "url2",
        },
        { uuid: "link-url1-skillA", source: "url1", target: "skillA" },
        { uuid: "link-url2-skillB", source: "url2", target: "skillB" },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(branchingTree), // eslint-disable-line jsdoc/require-jsdoc
      }),
    );

    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: {
        [DEFAULT_START_NODE_ID]: "2026-01-01T00:00:00Z",
        url1: "2026-01-02T00:00:00Z",
      },
      doneLinkTimestamps: {
        "link-start-url1": "2026-01-01T00:00:00Z",
      },
    });

    const { result } = renderNavigator({
      universalTree: branchingTree,
    });

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    // Start and url1 are done; skillA is the skill url1 teaches, so it should be
    // immediately queued next for practice (URL priority — skills prepended to front)
    expect(result.current.currentNodeId).toBe("skillA");
  });

  it("lands on first taught skill when URL with multiple targets is done", async () => {
    // Branch with one URL that teaches 3 skills
    const multiSkillTree: Tree = {
      nodes: [
        { uuid: DEFAULT_START_NODE_ID, type: "skill", name: "Start Skill" },
        { uuid: "url1", type: "url", name: "https://example.com/complete" },
        { uuid: "skillA", type: "skill", name: "Skill A" },
        { uuid: "skillB", type: "skill", name: "Skill B" },
        { uuid: "skillC", type: "skill", name: "Skill C" },
      ],
      links: [
        {
          uuid: "link-start-url1",
          source: DEFAULT_START_NODE_ID,
          target: "url1",
        },
        { uuid: "link-url1-skillA", source: "url1", target: "skillA" },
        { uuid: "link-url1-skillB", source: "url1", target: "skillB" },
        { uuid: "link-url1-skillC", source: "url1", target: "skillC" },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(multiSkillTree), // eslint-disable-line jsdoc/require-jsdoc
      }),
    );

    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: {
        [DEFAULT_START_NODE_ID]: "2026-01-01T00:00:00Z",
        url1: "2026-01-02T00:00:00Z",
      },
      doneLinkTimestamps: {
        "link-start-url1": "2026-01-01T00:00:00Z",
      },
    });

    const { result } = renderNavigator({
      universalTree: multiSkillTree,
    });

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    // url1's taught skills should be immediately available; land on one of them
    expect(["skillA", "skillB", "skillC"]).toContain(
      result.current.currentNodeId,
    );
  });

  it("skips first taught skill and lands on next when both URL and first skill are done", async () => {
    // Branch with one URL that teaches 3 skills
    const multiSkillTree: Tree = {
      nodes: [
        { uuid: DEFAULT_START_NODE_ID, type: "skill", name: "Start Skill" },
        { uuid: "url1", type: "url", name: "https://example.com/complete" },
        { uuid: "skillA", type: "skill", name: "Skill A" },
        { uuid: "skillB", type: "skill", name: "Skill B" },
        { uuid: "skillC", type: "skill", name: "Skill C" },
      ],
      links: [
        {
          uuid: "link-start-url1",
          source: DEFAULT_START_NODE_ID,
          target: "url1",
        },
        { uuid: "link-url1-skillA", source: "url1", target: "skillA" },
        { uuid: "link-url1-skillB", source: "url1", target: "skillB" },
        { uuid: "link-url1-skillC", source: "url1", target: "skillC" },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(multiSkillTree), // eslint-disable-line jsdoc/require-jsdoc
      }),
    );

    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: {
        [DEFAULT_START_NODE_ID]: "2026-01-01T00:00:00Z",
        url1: "2026-01-02T00:00:00Z",
        skillA: "2026-01-03T00:00:00Z",
      },
      doneLinkTimestamps: {
        "link-start-url1": "2026-01-01T00:00:00Z",
        "link-url1-skillA": "2026-01-03T00:00:00Z",
      },
    });

    const { result } = renderNavigator({
      universalTree: multiSkillTree,
    });

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    // skillA is done, so should land on one of the other taught skills (B or C)
    expect(["skillB", "skillC"]).toContain(result.current.currentNodeId);
  });

  it("advances to the next URL when all skills taught by a done URL are also done", async () => {
    // START → url1 → [skillA, skillB, skillC], skillA → url2 → skillD
    // url1 requires START; url2 requires skillA, skillB, skillC
    const multiSkillTree: Tree = {
      nodes: [
        { uuid: DEFAULT_START_NODE_ID, type: "skill", name: "Start Skill" },
        { uuid: "url1", type: "url", name: "https://example.com/lesson1" },
        { uuid: "skillA", type: "skill", name: "Skill A" },
        { uuid: "skillB", type: "skill", name: "Skill B" },
        { uuid: "skillC", type: "skill", name: "Skill C" },
        { uuid: "url2", type: "url", name: "https://example.com/lesson2" },
        { uuid: "skillD", type: "skill", name: "Skill D" },
      ],
      links: [
        {
          uuid: "link-start-url1",
          source: DEFAULT_START_NODE_ID,
          target: "url1",
        },
        { uuid: "link-url1-skillA", source: "url1", target: "skillA" },
        { uuid: "link-url1-skillB", source: "url1", target: "skillB" },
        { uuid: "link-url1-skillC", source: "url1", target: "skillC" },
        { uuid: "link-skillA-url2", source: "skillA", target: "url2" },
        { uuid: "link-url2-skillD", source: "url2", target: "skillD" },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(multiSkillTree), // eslint-disable-line jsdoc/require-jsdoc
      }),
    );

    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: {
        [DEFAULT_START_NODE_ID]: "2026-01-01T00:00:00Z",
        url1: "2026-01-02T00:00:00Z",
        skillA: "2026-01-03T00:00:00Z",
        skillB: "2026-01-04T00:00:00Z",
        skillC: "2026-01-05T00:00:00Z",
      },
      doneLinkTimestamps: {
        "link-start-url1": "2026-01-01T00:00:00Z",
        "link-url1-skillA": "2026-01-03T00:00:00Z",
        "link-url1-skillB": "2026-01-04T00:00:00Z",
        "link-url1-skillC": "2026-01-05T00:00:00Z",
      },
    });

    const { result } = renderNavigator({
      universalTree: multiSkillTree,
    });

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    // All nodes from url1's branch are done → should advance to url2
    expect(result.current.currentNodeId).toBe("url2");
  });

  it("sets currentNodeId to null when all path nodes are done", async () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: {
        [DEFAULT_START_NODE_ID]: "2026-01-01T00:00:00Z",
        url1: "2026-01-02T00:00:00Z",
        skill2: "2026-01-03T00:00:00Z",
      },
      doneLinkTimestamps: {
        "link-start-url1": "2026-01-01T00:00:00Z",
        "link-url1-skill2": "2026-01-02T00:00:00Z",
      },
    });

    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    expect(result.current.currentNodeId).toBeNull();
  });

  it("starts at first node when no nodes are done", async () => {
    const { result } = renderNavigator();

    await act(async () => {
      await result.current.handleGeneratePath();
    });

    expect(result.current.currentNodeId).toBe(DEFAULT_START_NODE_ID);
  });
});
