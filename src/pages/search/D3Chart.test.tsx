import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DONE_SKILL_FILL,
  DONE_URL_FILL,
  MARKED_FOR_STUDY_FILL,
} from "../../common-constants";
import { DEFAULT_START_NODE_ID } from "../../constants/graph";
import type { Tree } from "../../types/types";
import D3Chart from "./D3Chart";
import { resolveInitialFocusNodeId } from "./search-utils";

/* ── test fixtures ────────────────────────────────────────── */

const TREE: Tree = {
  nodes: [
    { uuid: "s1", type: "skill", name: "Skill 1" },
    { uuid: "u1", type: "url", name: "https://example.com" },
    { uuid: "s2", type: "skill", name: "Skill 2" },
  ],
  links: [
    { uuid: "l1", source: "s1", target: "u1" },
    { uuid: "l2", source: "u1", target: "s2" },
  ],
};

/* ── helpers ──────────────────────────────────────────────── */

/**
 *
 */
function getCircles(): SVGCircleElement[] {
  return Array.from(document.querySelectorAll("circle"));
}

/* ── done overlay tests ───────────────────────────────────── */

describe("D3Chart done overlays", () => {
  it("renders done skill node with done fill color", () => {
    render(
      <D3Chart
        doneNodeIds={["s1"]}
        doneNodeTimestamps={{ s1: "2026-01-15T10:30:00Z" }}
        tree={TREE}
      />,
    );

    const circles = getCircles();
    const skillCircle = circles[0]; // s1 is first in nodes array
    expect(skillCircle).toBeDefined();
    expect(skillCircle.getAttribute("data-done")).toBe("true");
    expect(skillCircle.getAttribute("fill")).toBe(DONE_SKILL_FILL);
  });

  it("renders done url node with done fill color", () => {
    render(
      <D3Chart
        doneNodeIds={["u1"]}
        doneNodeTimestamps={{ u1: "2026-01-15T10:30:00Z" }}
        tree={TREE}
      />,
    );

    const circles = getCircles();
    const urlCircle = circles[1]; // u1 is second in nodes array
    expect(urlCircle.getAttribute("data-done")).toBe("true");
    expect(urlCircle.getAttribute("fill")).toBe(DONE_URL_FILL);
  });

  it("does not set data-done on non-done nodes", () => {
    render(<D3Chart doneNodeIds={["s1"]} tree={TREE} />);

    const circles = getCircles();
    // s2 at index 2 should not be done
    expect(circles[2].getAttribute("data-done")).toBeNull();
  });
});

/* ── tooltip tests ────────────────────────────────────────── */

describe("D3Chart timestamp tooltips", () => {
  it("renders title element with completion timestamp for done node", () => {
    render(
      <D3Chart
        doneNodeIds={["s1"]}
        doneNodeTimestamps={{ s1: "2026-01-15T10:30:00Z" }}
        tree={TREE}
      />,
    );

    const title = document.querySelector("circle title");
    expect(title).not.toBeNull();
    expect(title?.textContent).toBe(
      "Skill: Skill 1\nCompleted on 2026-01-15T10:30:00Z",
    );
  });

  it("renders base node titles when nodes have no timestamps", () => {
    render(<D3Chart doneNodeIds={[]} tree={TREE} />);

    const titles = document.querySelectorAll("circle title");
    expect(titles.length).toBe(3);
    expect(titles[0].textContent).toBe("Skill: Skill 1");
    expect(titles[1].textContent).toBe("URL: https://example.com");
    expect(titles[2].textContent).toBe("Skill: Skill 2");
  });

  it("renders completion timestamps for done nodes and base title otherwise", () => {
    render(
      <D3Chart
        doneNodeIds={["s1", "u1"]}
        doneNodeTimestamps={{
          s1: "2026-01-15T10:30:00Z",
          u1: "2026-01-16T11:45:00Z",
        }}
        tree={TREE}
      />,
    );

    const titles = document.querySelectorAll("circle title");
    expect(titles.length).toBe(3);
    expect(titles[0].textContent).toBe(
      "Skill: Skill 1\nCompleted on 2026-01-15T10:30:00Z",
    );
    expect(titles[1].textContent).toBe(
      "URL: https://example.com\nCompleted on 2026-01-16T11:45:00Z",
    );
    expect(titles[2].textContent).toBe("Skill: Skill 2");
  });
});

/* ── marked-for-study tests ───────────────────────────────── */

describe("D3Chart marked-for-study nodes", () => {
  it("sets data-study attribute on marked-for-study nodes", () => {
    render(<D3Chart markedForStudyNodeIds={["s2"]} tree={TREE} />);

    const circles = getCircles();
    const studyCircle = circles[2]; // s2 is third
    expect(studyCircle.getAttribute("data-study")).toBe("true");
    expect(studyCircle.getAttribute("fill")).toBe(MARKED_FOR_STUDY_FILL);
  });

  it("does not set data-study on unmarked nodes", () => {
    render(<D3Chart markedForStudyNodeIds={["s2"]} tree={TREE} />);

    const circles = getCircles();
    expect(circles[0].getAttribute("data-study")).toBeNull();
    expect(circles[1].getAttribute("data-study")).toBeNull();
  });

  it("renders both done and study attributes when node is done and marked", () => {
    render(
      <D3Chart
        doneNodeIds={["s1"]}
        doneNodeTimestamps={{ s1: "2026-01-15T10:30:00Z" }}
        markedForStudyNodeIds={["s1"]}
        tree={TREE}
      />,
    );

    const circles = getCircles();
    const circle = circles[0];
    // Both data attributes should be set
    expect(circle.getAttribute("data-done")).toBe("true");
    expect(circle.getAttribute("data-study")).toBe("true");
    expect(circle.getAttribute("fill")).toBe(DONE_SKILL_FILL);
  });
});

/* ── hydration done overlay integration test ──────────────── */

describe("D3Chart hydration integration", () => {
  it("renders done overlays immediately when doneNodeIds provided on mount", () => {
    const doneIds = ["s1", "u1"];
    const timestamps = {
      s1: "2026-01-10T08:00:00Z",
      u1: "2026-01-12T14:00:00Z",
    };

    render(
      <D3Chart
        doneNodeIds={doneIds}
        doneNodeTimestamps={timestamps}
        tree={TREE}
      />,
    );

    const circles = getCircles();
    // Both s1 and u1 should be marked done
    expect(circles[0].getAttribute("data-done")).toBe("true");
    expect(circles[1].getAttribute("data-done")).toBe("true");
    // s2 should not be done
    expect(circles[2].getAttribute("data-done")).toBeNull();

    // Both should have tooltips
    const titles = document.querySelectorAll("circle title");
    expect(titles.length).toBe(3);
  });
});

/* ── resolveInitialFocusNodeId tests ─────────────────────── */

const TREE_WITH_START: Tree = {
  nodes: [
    { uuid: DEFAULT_START_NODE_ID, type: "skill", name: "E" },
    { uuid: "s1", type: "skill", name: "Skill 1" },
    { uuid: "u1", type: "url", name: "https://example.com" },
  ],
  links: [],
};

describe("resolveInitialFocusNodeId", () => {
  it("returns latest done node when progress exists and node is in tree", () => {
    const timestamps = {
      s1: "2026-01-10T08:00:00Z",
      u1: "2026-01-12T14:00:00Z", // latest
    };

    const result = resolveInitialFocusNodeId(timestamps, TREE_WITH_START);

    expect(result).toBe("u1");
  });

  it("returns earlier done node when it is the latest by timestamp", () => {
    const timestamps = {
      u1: "2026-01-10T08:00:00Z",
      s1: "2026-01-12T14:00:00Z", // latest
    };

    const result = resolveInitialFocusNodeId(timestamps, TREE_WITH_START);

    expect(result).toBe("s1");
  });

  it("falls back to DEFAULT_START_NODE_ID when no progress exists", () => {
    const result = resolveInitialFocusNodeId({}, TREE_WITH_START);

    expect(result).toBe(DEFAULT_START_NODE_ID);
  });

  it("returns null when tree has no nodes", () => {
    const result = resolveInitialFocusNodeId({}, { nodes: [], links: [] });

    expect(result).toBeNull();
  });

  it("positions the resolved focus node near the initial viewport target", async () => {
    const timestamps = {
      s1: "2026-01-10T08:00:00Z",
      u1: "2026-01-12T14:00:00Z", // latest
    };

    const resolvedFocusId = resolveInitialFocusNodeId(
      timestamps,
      TREE_WITH_START,
    );
    expect(resolvedFocusId).toBe("u1");

    render(
      <D3Chart initialFocusNodeId={resolvedFocusId} tree={TREE_WITH_START} />,
    );

    // TREE_WITH_START order: [E, s1, u1]
    const focusedCircle = getCircles()[2];

    await waitFor(() => {
      const cx = Number(focusedCircle.getAttribute("cx"));
      const cy = Number(focusedCircle.getAttribute("cy"));

      expect(Number.isFinite(cx)).toBe(true);
      expect(Number.isFinite(cy)).toBe(true);
      expect(cx).toBeCloseTo(200, 0);
      // Initial target is top-half focused (25% vertical), so it should start above center.
      expect(cy).toBeLessThan(200);
    });
  });
});
