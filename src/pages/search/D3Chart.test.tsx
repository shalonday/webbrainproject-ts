import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DONE_SKILL_FILL,
  DONE_URL_FILL,
  MARKED_FOR_STUDY_FILL,
} from "../../common-constants";
import type { Tree } from "../../types/types";
import D3Chart from "./D3Chart";

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
    expect(title?.textContent).toBe("Completed on 2026-01-15T10:30:00Z");
  });

  it("renders no title element when node has no timestamp", () => {
    render(<D3Chart doneNodeIds={[]} tree={TREE} />);

    const titles = document.querySelectorAll("circle title");
    expect(titles.length).toBe(0);
  });

  it("renders completion timestamps for all done nodes", () => {
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
    expect(titles.length).toBe(2);
    expect(titles[0].textContent).toBe("Completed on 2026-01-15T10:30:00Z");
    expect(titles[1].textContent).toBe("Completed on 2026-01-16T11:45:00Z");
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
    expect(titles.length).toBe(2);
  });
});
