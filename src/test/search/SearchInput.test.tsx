import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import * as perkClientModule from "../../api/perkClient";
import { server } from "../setup";
import {
  countTreeRequests,
  getSearchInput,
  performSearch,
  renderSearchPage,
  waitForGraphToLoad,
} from "./searchTestUtils";

const analyzeUrlMock = vi.fn().mockResolvedValue({
  url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  prerequisites: [],
  objectives: [],
});

/**
 * Tests for the Search input box functionality.
 */
describe("Search input box", () => {
  it(
    "is focused when tab is pressed four times (skips FABs)",
    { timeout: 20000 },
    async () => {
      renderSearchPage();
      const user = userEvent.setup();
      await waitForGraphToLoad();

      const searchInput = getSearchInput();
      expect(searchInput).toBeInTheDocument();

      expect(document.body).toHaveFocus();
      // First tab focuses the chatbot FAB
      await user.tab();
      // Second tab focuses the export progress FAB
      await user.tab();
      // Third tab focuses the import progress FAB
      await user.tab();
      // Fourth tab focuses the search input
      await user.tab();
      expect(searchInput).toHaveFocus();
    },
  );

  it("is focused when clicked", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    const searchInput = getSearchInput();
    expect(searchInput).toBeInTheDocument();
    await user.click(searchInput);
    expect(searchInput).toHaveFocus();
  });

  it("shows an add URL action and opens a prefilled dialog for URL-like text", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    const searchInput = getSearchInput();
    await user.click(searchInput);
    await user.keyboard("https://example.com/learn");

    const addUrlButton = screen.getByRole("button", { name: /add url/i });
    expect(addUrlButton).toBeInTheDocument();

    await user.click(addUrlButton);

    const dialog = await screen.findByRole("dialog", { name: /add url/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText(/^URL$/i)).toHaveValue(
      "https://example.com/learn",
    );
  });

  it("rejects empty or malformed URLs in the ingestion dialog", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    const searchInput = getSearchInput();
    await user.click(searchInput);
    await user.keyboard("https://example.com/learn");

    await user.click(screen.getByRole("button", { name: /add url/i }));

    const dialog = await screen.findByRole("dialog", { name: /add url/i });
    const urlField = screen.getByLabelText(/^URL$/i);
    const submitButton = within(dialog).getByRole("button", {
      name: /^add url$/i,
    });

    await user.clear(urlField);
    await user.type(urlField, "not-a-valid-url");

    expect(urlField).toHaveValue("not-a-valid-url");
    expect(
      screen.getByText("Enter a valid http or https URL."),
    ).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it(
    "submits a valid URL to the ingestion endpoint when confirmed",
    { timeout: 20000 },
    async () => {
      analyzeUrlMock.mockClear();
      vi.spyOn(perkClientModule, "createPerkAPIClient").mockReturnValue({
        analyzeUrl: analyzeUrlMock,
      } as never);

      renderSearchPage();
      const user = userEvent.setup();
      await waitForGraphToLoad();

      const searchInput = getSearchInput();
      await user.click(searchInput);
      await user.keyboard(
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      );
      await user.click(screen.getByRole("button", { name: /add url/i }));

      const dialog = await screen.findByRole("dialog", { name: /add url/i });
      const submitButton = within(dialog).getByRole("button", {
        name: /^add url$/i,
      });

      await user.click(submitButton);

      expect(analyzeUrlMock).toHaveBeenCalledWith(
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      );
      expect(
        screen.queryByRole("dialog", { name: /add url/i }),
      ).not.toBeInTheDocument();
    },
  );

  it("shows the backend error message when URL submission fails", async () => {
    const failedAnalyzeUrlMock = vi.fn().mockRejectedValue({
      response: {
        data: {
          error: "URL domain is not allowed for ingestion.",
        },
      },
    });

    vi.spyOn(perkClientModule, "createPerkAPIClient").mockReturnValue({
      analyzeUrl: failedAnalyzeUrlMock,
    } as never);

    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    const searchInput = getSearchInput();
    await user.click(searchInput);
    await user.keyboard("https://example.com/learn");
    await user.click(screen.getByRole("button", { name: /add url/i }));

    const dialog = await screen.findByRole("dialog", { name: /add url/i });
    const submitButton = within(dialog).getByRole("button", {
      name: /^add url$/i,
    });

    await user.click(submitButton);

    expect(
      await screen.findByText("URL domain is not allowed for ingestion."),
    ).toBeInTheDocument();
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
