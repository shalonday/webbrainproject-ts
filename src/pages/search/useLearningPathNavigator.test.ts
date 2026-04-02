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
