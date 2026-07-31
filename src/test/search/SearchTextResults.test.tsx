import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  performSearch,
  renderSearchPage,
  waitForGraphToLoad,
} from "./searchTestUtils";

/**
 * Tests for text-based search results display.
 */
describe("Search Page Text Results Display", () => {
  it(
    "After a user confirms the keyword they're searching for, the results are displayed in text form",
    { timeout: 20000 },
    async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "javascript");

    const results = await screen.findAllByRole(
      "button",
      {
        name: /javascript/i,
      },
      {
        timeout: 10000,
      },
    );
    expect(results.length).toBeGreaterThan(0);
    },
  );

  it("If there are no results, the user is informed", { timeout: 20000 }, async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "xyzabc123");

    await screen.findByText(/no results found/i);
  });

  it("provides a visual cue that a search result is selected", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "javascript");

    const results = await screen.findAllByRole(
      "button",
      {
        name: /javascript/i,
      },
      {
        timeout: 10000,
      },
    );
    expect(results.length).toBeGreaterThan(0);

    const firstResult = results[0];
    expect(firstResult).toHaveAttribute("data-selected", "false");

    await user.click(firstResult);
    await waitFor(() => {
      expect(firstResult).toHaveAttribute("data-selected", "true");
    });
  });
});
