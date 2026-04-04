import { describe, expect, it } from "vitest";

import {
  ACTIVE_LINK_COLOR,
  ACTIVE_MODULE_FILL,
  ACTIVE_SKILL_FILL,
  DONE_LINK_COLOR,
  DONE_SKILL_FILL,
  DONE_URL_FILL,
  INACTIVE_LINK_COLOR,
  INACTIVE_MODULE_FILL,
  INACTIVE_SKILL_FILL,
  MARKED_FOR_STUDY_FILL,
} from "../../common-constants";
import type { Tree } from "../../types/types";
import {
  getLinkColor,
  getLinkOpacity,
  getNodeFill,
  getNodeOpacity,
  isLinkDone,
  isLinkInPath,
  isNodeInPath,
  type LinkLike,
  type NodeLike,
} from "./graph-styles";

/* ── helpers ──────────────────────────────────────────────── */

/**
 *
 */
function makeNode(uuid: string, type: "skill" | "url" = "skill"): NodeLike {
  return { uuid, type };
}

/**
 *
 */
function makeLink(uuid: string, source: string, target: string): LinkLike {
  return { uuid, source, target };
}

const MINI_TREE: Tree = {
  nodes: [
    { uuid: "s1", type: "skill", name: "Skill 1" },
    { uuid: "u1", type: "url", name: "https://example.com" },
  ],
  links: [{ uuid: "l1", source: "s1", target: "u1" }],
};

/* ── getNodeFill ──────────────────────────────────────────── */

describe("getNodeFill", () => {
  it("returns INACTIVE_SKILL_FILL for null/missing node", () => {
    expect(getNodeFill(null as unknown as NodeLike, [], [])).toBe(
      INACTIVE_SKILL_FILL,
    );
  });

  it("returns DONE_SKILL_FILL for a done skill", () => {
    expect(getNodeFill(makeNode("s1", "skill"), [], ["s1"])).toBe(
      DONE_SKILL_FILL,
    );
  });

  it("returns DONE_URL_FILL for a done url", () => {
    expect(getNodeFill(makeNode("u1", "url"), [], ["u1"])).toBe(DONE_URL_FILL);
  });

  it("done takes priority over marked-for-study", () => {
    expect(getNodeFill(makeNode("s1", "skill"), [], ["s1"], ["s1"])).toBe(
      DONE_SKILL_FILL,
    );
  });

  it("returns MARKED_FOR_STUDY_FILL for a study-target node", () => {
    expect(getNodeFill(makeNode("s1", "skill"), [], [], ["s1"])).toBe(
      MARKED_FOR_STUDY_FILL,
    );
  });

  it("selected takes priority over marked-for-study", () => {
    expect(getNodeFill(makeNode("s1", "skill"), ["s1"], [], ["s1"])).toBe(
      ACTIVE_SKILL_FILL,
    );
  });

  it("returns ACTIVE_SKILL_FILL for a selected skill", () => {
    expect(getNodeFill(makeNode("s1", "skill"), ["s1"], [])).toBe(
      ACTIVE_SKILL_FILL,
    );
  });

  it("returns INACTIVE_SKILL_FILL for an unselected skill", () => {
    expect(getNodeFill(makeNode("s1", "skill"), [], [])).toBe(
      INACTIVE_SKILL_FILL,
    );
  });

  it("returns ACTIVE_MODULE_FILL for a selected url", () => {
    expect(getNodeFill(makeNode("u1", "url"), ["u1"], [])).toBe(
      ACTIVE_MODULE_FILL,
    );
  });

  it("returns INACTIVE_MODULE_FILL for an unselected url", () => {
    expect(getNodeFill(makeNode("u1", "url"), [], [])).toBe(
      INACTIVE_MODULE_FILL,
    );
  });
});

/* ── isNodeInPath / getNodeOpacity ────────────────────────── */

describe("isNodeInPath", () => {
  it("returns true when node is in the path tree", () => {
    expect(isNodeInPath(makeNode("s1"), MINI_TREE)).toBe(true);
  });

  it("returns false when node is not in the path tree", () => {
    expect(isNodeInPath(makeNode("other"), MINI_TREE)).toBe(false);
  });

  it("returns false for null path tree", () => {
    expect(isNodeInPath(makeNode("s1"), null)).toBe(false);
  });
});

describe("getNodeOpacity", () => {
  it("returns 1 when no path is active", () => {
    expect(getNodeOpacity(makeNode("s1"), null)).toBe(1);
  });

  it("returns 1 for a node in the path", () => {
    expect(getNodeOpacity(makeNode("s1"), MINI_TREE)).toBe(1);
  });

  it("returns 0.25 for a node not in the path", () => {
    expect(getNodeOpacity(makeNode("other"), MINI_TREE)).toBe(0.25);
  });
});

/* ── isLinkDone / isLinkInPath / getLinkColor / getLinkOpacity */

describe("isLinkDone", () => {
  it("returns true when link is in done list", () => {
    expect(isLinkDone(makeLink("l1", "s1", "u1"), ["l1"])).toBe(true);
  });

  it("returns false when link is not in done list", () => {
    expect(isLinkDone(makeLink("l1", "s1", "u1"), [])).toBe(false);
  });
});

describe("isLinkInPath", () => {
  it("returns true when link source/target match path", () => {
    expect(isLinkInPath(makeLink("l1", "s1", "u1"), MINI_TREE)).toBe(true);
  });

  it("returns false when link is not in path", () => {
    expect(isLinkInPath(makeLink("l2", "x", "y"), MINI_TREE)).toBe(false);
  });

  it("returns false for null path", () => {
    expect(isLinkInPath(makeLink("l1", "s1", "u1"), null)).toBe(false);
  });
});

describe("getLinkColor", () => {
  it("returns DONE_LINK_COLOR for a done link", () => {
    expect(getLinkColor(makeLink("l1", "s1", "u1"), MINI_TREE, ["l1"])).toBe(
      DONE_LINK_COLOR,
    );
  });

  it("returns ACTIVE_LINK_COLOR for a link in the path", () => {
    expect(getLinkColor(makeLink("l1", "s1", "u1"), MINI_TREE, [])).toBe(
      ACTIVE_LINK_COLOR,
    );
  });

  it("returns INACTIVE_LINK_COLOR for a link not in path and not done", () => {
    expect(getLinkColor(makeLink("l2", "x", "y"), MINI_TREE, [])).toBe(
      INACTIVE_LINK_COLOR,
    );
  });
});

describe("getLinkOpacity", () => {
  it("returns 1 when no path is active", () => {
    expect(getLinkOpacity(makeLink("l1", "s1", "u1"), null)).toBe(1);
  });

  it("returns 1 for a link in the path", () => {
    expect(getLinkOpacity(makeLink("l1", "s1", "u1"), MINI_TREE)).toBe(1);
  });

  it("returns 0.2 for a link not in the path", () => {
    expect(getLinkOpacity(makeLink("l2", "x", "y"), MINI_TREE)).toBe(0.2);
  });
});
