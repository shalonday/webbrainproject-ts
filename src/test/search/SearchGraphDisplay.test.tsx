import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ACTIVE_MODULE_FILL, ACTIVE_SKILL_FILL } from "../../common-constants";
import {
  assertGraphIsRendered,
  getGraphNodeSnapshots,
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

  it(
    "After a user confirms the keyword they're searching for, the resulting nodes are adequately highlighted",
    { timeout: 20000 },
    async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "javascript");

    const matchingNodes = getGraphNodeSnapshots().filter((node) =>
      node.label.toLowerCase().includes("javascript"),
    );
    expect(matchingNodes.length).toBeGreaterThan(0);

    matchingNodes.forEach((node) => {
      expect(node.fill === ACTIVE_SKILL_FILL || node.fill === ACTIVE_MODULE_FILL).toBe(
        true,
      );
    });
    },
  );

  it(
    "keeps the selected search result highlighted in the graph",
    { timeout: 20000 },
    async () => {
    renderSearchPage();
    await waitForGraphToLoad();

    const user = userEvent.setup();
    await performSearch(user, "javascript");

    const results = await screen.findAllByRole("button", {
      name: /javascript/i,
    });
    await user.click(results[0]);

    const matchingNodes = getGraphNodeSnapshots().filter((node) =>
      node.label.toLowerCase().includes("javascript"),
    );
    expect(
      matchingNodes.some((node) => {
        return node.fill === ACTIVE_SKILL_FILL || node.fill === ACTIVE_MODULE_FILL;
      }),
    ).toBe(true);
    },
  );
});
