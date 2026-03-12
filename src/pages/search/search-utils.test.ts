import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Link, Tree, WBNode } from "../../types/types";
import { computeMoveForward } from "./search-utils";

/**
 * Creates a test WBNode.
 */
function makeNode(uuid: string, type: "skill" | "url", name?: string): WBNode {
  return { uuid, type, name: name ?? uuid };
}

/**
 * Creates a test Link.
 */
function makeLink(uuid: string, source: string, target: string): Link {
  return { uuid, source, target };
}

// Deterministic shuffle: Math.random() = 0.99 → Fisher-Yates identity (no swap)
beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.99);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("computeMoveForward", () => {
  describe("linear path traversal", () => {
    // E(skill) → url1 → skillA → url2 → skillB
    const tree: Tree = {
      nodes: [
        makeNode("E", "skill"),
        makeNode("url1", "url", "https://example.com/1"),
        makeNode("skillA", "skill"),
        makeNode("url2", "url", "https://example.com/2"),
        makeNode("skillB", "skill"),
      ],
      links: [
        makeLink("L1", "E", "url1"),
        makeLink("L2", "url1", "skillA"),
        makeLink("L3", "skillA", "url2"),
        makeLink("L4", "url2", "skillB"),
      ],
    };

    it("advances from start skill to the first URL", () => {
      const result = computeMoveForward(tree, tree, "E", [], []);
      expect(result.nextNode?.uuid).toBe("url1");
    });

    it("advances from URL to its outgoing skill", () => {
      const result = computeMoveForward(tree, tree, "url1", ["E"], ["skillA"]);
      expect(result.nextNode?.uuid).toBe("skillA");
    });

    it("traverses the full linear path step by step", () => {
      // Step 1: E → url1
      const r1 = computeMoveForward(tree, tree, "E", [], []);
      expect(r1.nextNode?.uuid).toBe("url1");

      // Step 2: url1 → skillA (already queued from step 1)
      const r2 = computeMoveForward(tree, tree, "url1", ["E"], r1.updatedQueue);
      expect(r2.nextNode?.uuid).toBe("skillA");

      // Step 3: skillA → url2
      const r3 = computeMoveForward(
        tree,
        tree,
        "skillA",
        ["E", "url1"],
        r2.updatedQueue,
      );
      expect(r3.nextNode?.uuid).toBe("url2");

      // Step 4: url2 → skillB (already queued from step 3)
      const r4 = computeMoveForward(
        tree,
        tree,
        "url2",
        ["E", "url1", "skillA"],
        r3.updatedQueue,
      );
      expect(r4.nextNode?.uuid).toBe("skillB");

      // Step 5: skillB is terminal
      const r5 = computeMoveForward(
        tree,
        tree,
        "skillB",
        ["E", "url1", "skillA", "url2"],
        r4.updatedQueue,
      );
      expect(r5.nextNode).toBeNull();
      expect(r5.updatedQueue).toEqual([]);
    });
  });

  describe("branching at skill node", () => {
    // E → [url1, url2], url1 → skillA, url2 → skillB
    const tree: Tree = {
      nodes: [
        makeNode("E", "skill"),
        makeNode("url1", "url", "https://example.com/1"),
        makeNode("url2", "url", "https://example.com/2"),
        makeNode("skillA", "skill"),
        makeNode("skillB", "skill"),
      ],
      links: [
        makeLink("L1", "E", "url1"),
        makeLink("L2", "E", "url2"),
        makeLink("L3", "url1", "skillA"),
        makeLink("L4", "url2", "skillB"),
      ],
    };

    it("queues each URL grouped with its child skills", () => {
      const result = computeMoveForward(tree, tree, "E", [], []);
      // Identity shuffle: [url1, skillA, url2, skillB]
      // url1 dequeued first
      expect(result.nextNode?.uuid).toBe("url1");
      expect(result.updatedQueue).toEqual(["skillA", "url2", "skillB"]);
    });

    it("processes second branch from queue after first completes", () => {
      const result = computeMoveForward(
        tree,
        tree,
        "skillA",
        ["E", "url1"],
        ["url2", "skillB"],
      );
      expect(result.nextNode?.uuid).toBe("url2");
      expect(result.updatedQueue).toEqual(["skillB"]);
    });
  });

  describe("URL priority — skills prepended to front", () => {
    it("prepends outgoing skills before existing queue items", () => {
      const tree: Tree = {
        nodes: [
          makeNode("pre", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("skillA", "skill"),
          makeNode("skillB", "skill"),
          makeNode("pending", "skill"),
        ],
        links: [
          makeLink("L0", "pre", "url1"),
          makeLink("L1", "url1", "skillA"),
          makeLink("L2", "url1", "skillB"),
        ],
      };
      // url1 completed, existing queue has ["pending"]
      const result = computeMoveForward(
        tree,
        tree,
        "url1",
        ["pre"],
        ["pending"],
      );
      // Skills prepended: [skillA, skillB, pending]
      expect(result.nextNode?.uuid).toBe("skillA");
      expect(result.updatedQueue).toEqual(["skillB", "pending"]);
    });

    it("does not re-queue skills already in the queue", () => {
      const tree: Tree = {
        nodes: [
          makeNode("pre", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("skillA", "skill"),
        ],
        links: [
          makeLink("L0", "pre", "url1"),
          makeLink("L1", "url1", "skillA"),
        ],
      };
      // skillA already in queue — should not be added again
      const result = computeMoveForward(
        tree,
        tree,
        "url1",
        ["pre"],
        ["skillA"],
      );
      expect(result.nextNode?.uuid).toBe("skillA");
      expect(result.updatedQueue).toEqual([]);
    });
  });

  describe("prerequisite gating", () => {
    const nodes = [
      makeNode("E", "skill"),
      makeNode("url1", "url", "https://example.com/1"),
      makeNode("url2", "url", "https://example.com/2"),
      makeNode("skillA", "skill"),
      makeNode("skillB", "skill"),
    ];
    const pathTree: Tree = {
      nodes,
      links: [
        makeLink("L1", "E", "url1"),
        makeLink("L2", "E", "url2"),
        makeLink("L3", "url1", "skillA"),
        makeLink("L4", "url2", "skillB"),
      ],
    };
    // url2 additionally requires skillA in the universal tree
    const universalTree: Tree = {
      nodes,
      links: [...pathTree.links, makeLink("Lp", "skillA", "url2")],
    };

    it("skips URL whose prerequisites are not met", () => {
      const result = computeMoveForward(
        pathTree,
        universalTree,
        "E",
        [],
        ["url2", "url1"],
      );
      // url2 is first but requires skillA (not done) -> skipped.
      // url1 is next and eligible because E is done.
      expect(result.nextNode?.uuid).toBe("url1");
      expect(result.updatedQueue).toEqual(["url2"]);
    });

    it("allows URL once its prerequisites are satisfied", () => {
      // E, url1, skillA done → url2 prereq (skillA) now met
      const result = computeMoveForward(
        pathTree,
        universalTree,
        "skillA",
        ["E", "url1"],
        ["url2", "skillB"],
      );
      expect(result.nextNode?.uuid).toBe("url2");
    });
  });

  describe("duplicate prevention (diamond)", () => {
    // E → url1, E → url2, url1 → skillA, url2 → skillA
    const tree: Tree = {
      nodes: [
        makeNode("E", "skill"),
        makeNode("url1", "url", "https://example.com/1"),
        makeNode("url2", "url", "https://example.com/2"),
        makeNode("skillA", "skill"),
      ],
      links: [
        makeLink("L1", "E", "url1"),
        makeLink("L2", "E", "url2"),
        makeLink("L3", "url1", "skillA"),
        makeLink("L4", "url2", "skillA"),
      ],
    };

    it("does not queue a node already queued from another parent", () => {
      const result = computeMoveForward(tree, tree, "E", [], []);
      // url1 grouped with skillA; url2's child skillA already queued → skipped
      const allIds = [result.nextNode?.uuid, ...result.updatedQueue];
      const skillACount = allIds.filter((id) => id === "skillA").length;
      expect(skillACount).toBe(1);
    });
  });

  describe("link completion", () => {
    it("marks all incoming links done when entering a URL", () => {
      const tree: Tree = {
        nodes: [
          makeNode("skillA", "skill"),
          makeNode("skillB", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("skillC", "skill"),
        ],
        links: [
          makeLink("L1", "skillA", "url1"),
          makeLink("L2", "skillB", "url1"),
          makeLink("L3", "url1", "skillC"),
        ],
      };
      const result = computeMoveForward(
        tree,
        tree,
        "skillB",
        ["skillA"],
        ["url1"],
      );
      expect(result.nextNode?.uuid).toBe("url1");
      expect(result.newDoneLinkIds).toEqual(
        expect.arrayContaining(["L1", "L2"]),
      );
      expect(result.newDoneLinkIds).toHaveLength(2);
    });

    // A skill can be considered learned from any one completed incoming URL;
    // additional incoming URLs are alternative resources, not mandatory prerequisites.
    it("marks only incoming links from done sources when entering a skill", () => {
      const tree: Tree = {
        nodes: [
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("url2", "url", "https://example.com/2"),
          makeNode("skillA", "skill"),
          makeNode("pre", "skill"),
        ],
        links: [
          makeLink("L0", "pre", "url1"),
          makeLink("L1", "url1", "skillA"),
          makeLink("L2", "url2", "skillA"),
        ],
      };
      // url1 done, url2 NOT done, skillA in queue
      const result = computeMoveForward(
        tree,
        tree,
        "url1",
        ["pre"],
        ["skillA"],
      );
      expect(result.nextNode?.uuid).toBe("skillA");
      expect(result.newDoneLinkIds).toContain("L1");
      expect(result.newDoneLinkIds).not.toContain("L2");
    });
  });

  describe("queue-only progression", () => {
    it("dequeues from existing queue when current node has no outgoing links", () => {
      const tree: Tree = {
        nodes: [
          makeNode("E", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("url2", "url", "https://example.com/2"),
          makeNode("skillA", "skill"),
          makeNode("skillB", "skill"),
        ],
        links: [
          makeLink("L1", "E", "url1"),
          makeLink("L2", "E", "url2"),
          makeLink("L3", "url1", "skillA"),
          makeLink("L4", "url2", "skillB"),
        ],
      };
      // skillA has no outgoing links. Queue still has [url2, skillB]
      const result = computeMoveForward(
        tree,
        tree,
        "skillA",
        ["E", "url1"],
        ["url2", "skillB"],
      );
      expect(result.nextNode?.uuid).toBe("url2");
    });
  });

  describe("edge cases", () => {
    // I'm not even sure how this would happen in practice. Here, both skillA and skillB are prerequisites for url1, and url1 should effectively be unreachable. If for some reason we are able to enter this loop, the function should not get stuck in an infinite loop.
    it("handles a completed cycle without infinite loop", () => {
      const tree: Tree = {
        nodes: [
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("skillA", "skill"),
          makeNode("url2", "url", "https://example.com/2"),
          makeNode("skillB", "skill"),
        ],
        links: [
          makeLink("L1", "url1", "skillA"),
          makeLink("L2", "skillA", "url2"),
          makeLink("L3", "url2", "skillB"),
          makeLink("L4", "skillB", "url1"),
        ],
      };
      // The cycle is already complete up to skillB, so url1 should not be re-queued.
      const result = computeMoveForward(
        tree,
        tree,
        "skillB",
        ["url1", "skillA", "url2"],
        [],
      );
      expect(result.nextNode).toBeNull();
      expect(result.updatedQueue).toEqual([]);
    });

    it("returns null when all queued URLs have unreachable prerequisites (deadlock)", () => {
      const pathNodes = [
        makeNode("E", "skill"),
        makeNode("urlA", "url", "https://example.com/a"),
        makeNode("urlB", "url", "https://example.com/b"),
      ];
      const pathTree: Tree = {
        nodes: pathNodes,
        links: [makeLink("L1", "E", "urlA"), makeLink("L2", "E", "urlB")],
      };
      // Both URLs require external skills not present in the path
      const universalTree: Tree = {
        nodes: [
          ...pathNodes,
          makeNode("extSkillA", "skill"),
          makeNode("extSkillB", "skill"),
        ],
        links: [
          ...pathTree.links,
          makeLink("Lp1", "extSkillA", "urlA"),
          makeLink("Lp2", "extSkillB", "urlB"),
        ],
      };
      const result = computeMoveForward(pathTree, universalTree, "E", [], []);
      expect(result.nextNode).toBeNull();
      expect(result.updatedQueue).toEqual(["urlA", "urlB"]);
    });

    it("gracefully skips link targets not present in pathTree nodes", () => {
      const tree: Tree = {
        nodes: [makeNode("E", "skill")],
        links: [makeLink("L1", "E", "ghost")],
      };
      const result = computeMoveForward(tree, tree, "E", [], []);
      expect(result.nextNode).toBeNull();
      expect(result.updatedQueue).toEqual([]);
    });

    it("skips already-done nodes in the queue during selection", () => {
      const tree: Tree = {
        nodes: [
          makeNode("E", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("url2", "url", "https://example.com/2"),
          makeNode("skillA", "skill"),
          makeNode("skillB", "skill"),
        ],
        links: [
          makeLink("L1", "E", "url1"),
          makeLink("L2", "url1", "skillA"),
          makeLink("L3", "E", "url2"),
          makeLink("L4", "url2", "skillB"),
        ],
      };
      // skillA already done and lingering in queue
      const result = computeMoveForward(
        tree,
        tree,
        "E",
        ["skillA"],
        ["skillA", "url2"],
      );
      // skillA done -> skipped, then url2 is the next eligible queued node.
      expect(result.nextNode?.uuid).toBe("url2");
    });

    it("guards against unexpected null universalTree", () => {
      const tree: Tree = {
        nodes: [
          makeNode("E", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
        ],
        links: [makeLink("L1", "E", "url1")],
      };
      // Defensive fallback only: in normal flow, pathTree is derived from universalTree.
      const result = computeMoveForward(tree, null, "E", [], []);
      expect(result.nextNode?.uuid).toBe("url1");
    });

    it("returns null at terminal node with empty queue", () => {
      const tree: Tree = {
        nodes: [makeNode("skillA", "skill")],
        links: [],
      };
      const result = computeMoveForward(tree, tree, "skillA", [], []);
      expect(result.nextNode).toBeNull();
      expect(result.updatedQueue).toEqual([]);
    });
  });

  describe("queue order preservation", () => {
    it("appends new items after existing queue when on skill node", () => {
      const tree: Tree = {
        nodes: [
          makeNode("E", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("skillA", "skill"),
          makeNode("existingUrl", "url", "https://example.com/existing"),
          makeNode("existingSkill", "skill"),
        ],
        links: [
          makeLink("L1", "E", "url1"),
          makeLink("L2", "url1", "skillA"),
          makeLink("L3", "E", "existingUrl"),
          makeLink("L4", "existingUrl", "existingSkill"),
        ],
      };
      const result = computeMoveForward(tree, tree, "E", [], ["existingUrl"]);
      // Existing queue preserved at front: [existingUrl, url1, skillA]
      // existingUrl is first eligible
      expect(result.nextNode?.uuid).toBe("existingUrl");
      expect(result.updatedQueue).toEqual(["url1", "skillA"]);
    });
  });

  describe("shuffle determinism", () => {
    it("produces different queue order with different Math.random values", () => {
      vi.restoreAllMocks();
      // Math.random = 0.3 → Fisher-Yates swaps: j = floor(0.3 * 2) = 0
      // Array [url1, url2] becomes [url2, url1]
      vi.spyOn(Math, "random").mockReturnValue(0.3);

      const tree: Tree = {
        nodes: [
          makeNode("E", "skill"),
          makeNode("url1", "url", "https://example.com/1"),
          makeNode("url2", "url", "https://example.com/2"),
          makeNode("skillA", "skill"),
          makeNode("skillB", "skill"),
        ],
        links: [
          makeLink("L1", "E", "url1"),
          makeLink("L2", "E", "url2"),
          makeLink("L3", "url1", "skillA"),
          makeLink("L4", "url2", "skillB"),
        ],
      };

      const result = computeMoveForward(tree, tree, "E", [], []);
      // Shuffled to [url2, url1] → grouped: [url2, skillB, url1, skillA]
      // url2 selected first
      expect(result.nextNode?.uuid).toBe("url2");
    });
  });
});
