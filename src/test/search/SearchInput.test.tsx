import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { server } from "../setup";
import {
  countTreeRequests,
  getSearchInput,
  performSearch,
  renderSearchPage,
  waitForGraphToLoad,
} from "./searchTestUtils";

/**
 * Tests for the Search input box functionality.
 */
describe("Search input box", () => {
  it("is focused when tab is pressed twice (skips chatbot FAB)", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    const searchInput = getSearchInput();
    expect(searchInput).toBeInTheDocument();

    expect(document.body).toHaveFocus();
    // First tab focuses the chatbot FAB
    await user.tab();
    // Second tab focuses the search input
    await user.tab();
    expect(searchInput).toHaveFocus();
  });

  it("is focused when clicked", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    const searchInput = getSearchInput();
    expect(searchInput).toBeInTheDocument();
    await user.click(searchInput);
    expect(searchInput).toHaveFocus();
  });

  it("when focused, pressing Enter filters locally without refetching", async () => {
    const requests: string[] = [];
    /**
     * Collects each MSW-captured request so the test can assert a fetch occurred.
     *
     * @param params - Object containing the request.
     * @param params.request - The MSW request object.
     */
    const handleRequestStart = ({ request }: { request: Request }) => {
      requests.push(`${request.method} ${request.url}`);
    };

    server.events.on("request:start", handleRequestStart);

    try {
      renderSearchPage();
      await waitForGraphToLoad();

      const initialTreeRequests = countTreeRequests(requests);
      const user = userEvent.setup();

      await performSearch(user, "javascript");

      await expect(async () => {
        await waitForGraphToLoad();
      }).not.toThrow();

      expect(countTreeRequests(requests)).toBe(initialTreeRequests);
    } finally {
      server.events.removeAllListeners("request:start");
    }
  }, 60000);
});
