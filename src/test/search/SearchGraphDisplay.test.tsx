import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ACTIVE_MODULE_FILL, ACTIVE_SKILL_FILL } from "../../common-constants";
import {
  assertGraphIsRendered,
  findNodeByType,
  findNodesWithText,
  performSearch,
  renderSearchPage,
  waitForGraphToLoad,
} from "./searchTestUtils";

/**
 * Tests for graph visualization behavior.
 */
describe("Search Page Graph Display", () => {
  it("loads and displays the universal tree when entering the search page", async () => {
    renderSearchPage();
    await waitForGraphToLoad();

    assertGraphIsRendered();
  });

  it("After a user confirms the keyword they're searching for, the resulting nodes are adequately highlighted", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "javascript");

    const matchingNodes = findNodesWithText("javascript");
    expect(matchingNodes.length).toBeGreaterThan(0);

    matchingNodes.forEach((node) => {
      const fill = node.getAttribute("fill");
      expect(fill === ACTIVE_SKILL_FILL || fill === ACTIVE_MODULE_FILL).toBe(
        true,
      );
    });
  });

  it("highlights a clicked node", async () => {
    renderSearchPage();
    await waitForGraphToLoad();
    assertGraphIsRendered();

    const user = userEvent.setup();
    const circles = document.querySelectorAll("circle");
    const firstCircle = circles[0];
    await user.click(firstCircle);

    expect(firstCircle).toHaveAttribute("fill", ACTIVE_SKILL_FILL);

    const urlNode = findNodeByType("url");
    if (urlNode) {
      await user.click(urlNode);
      expect(urlNode).toHaveAttribute("fill", ACTIVE_MODULE_FILL);
    }
  });
});
