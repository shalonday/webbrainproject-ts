import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  ACTIVE_MODULE_FILL,
  ACTIVE_SKILL_FILL,
  BASE_URL,
} from "../../common-constants";
import { SkillTreesContextProvider } from "../../contexts/SkillTreesContext";
import { server } from "../../test/setup";
import type { WBNode } from "../../types/types";
import Search from "./Search";

// =============================================================================
// ENTRYPOINT: Test Suites for Search Page
// =============================================================================

/**
 * Tests for the Search input box functionality.
 */
describe("Search input box", () => {
  it("is focused when tab is pressed once", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    const searchInput = getSearchInput();
    expect(searchInput).toBeInTheDocument();

    expect(document.body).toHaveFocus();
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

      await waitFor(
        () => expect(countTreeRequests(requests)).toBe(initialTreeRequests),
        { timeout: 30000 },
      );
    } finally {
      server.events.removeAllListeners("request:start");
    }
  }, 60000);
});

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

    await waitFor(
      () => {
        const matchingNodes = findNodesWithText("javascript");
        expect(matchingNodes.length).toBeGreaterThan(0);

        matchingNodes.forEach((node) => {
          const fill = node.getAttribute("fill");
          expect(
            fill === ACTIVE_SKILL_FILL || fill === ACTIVE_MODULE_FILL,
          ).toBe(true);
        });
      },
      { timeout: 30000 },
    );
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

/**
 * Tests for text-based search results display.
 */
describe("Search Page Text Results Display", () => {
  it("After a user confirms the keyword they're searching for, the results are displayed in text form", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "javascript");

    const results = await screen.findAllByRole("button", {
      name: /javascript/i,
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it("If there are no results, the user is informed", async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "xyzabc123");

    await screen.findByText(/no results found/i);
  });

  it("provides a visual cue that a search result is selected", () => {
    throw new Error();
  });
});

/**
 * Tests for the Generate Path button functionality.
 */
describe("Generate Path Button", () => {
  it("Clicking on the button while a search result is selected highlights the learning path to the result", () => {
    throw new Error();
  });

  it("Clicking on the button when there is nothing selected informs the user to select a search result first", () => {
    throw new Error();
  });
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Renders the Search page component with all necessary providers.
 */
function renderSearchPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SkillTreesContextProvider>
        <Search />
      </SkillTreesContextProvider>
    </QueryClientProvider>,
  );
}

/**
 * Waits for the loading spinner to disappear, indicating the graph has loaded.
 *
 * @throws {Error} If the graph doesn't load within the timeout period.
 */
async function waitForGraphToLoad(): Promise<void> {
  await waitFor(
    () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
    { timeout: 30000 },
  );
}

/**
 * Gets the search input element from the page.
 *
 * @returns The search input HTMLElement.
 */
function getSearchInput(): HTMLElement {
  return screen.getByPlaceholderText(/search for a skill or url/i);
}

/**
 * Performs a complete search operation: click input, type search term, press Enter.
 *
 * @param user - The userEvent instance for interaction.
 * @param searchTerm - The term to search for.
 */
async function performSearch(
  user: ReturnType<typeof userEvent.setup>,
  searchTerm: string,
): Promise<void> {
  const searchInput = getSearchInput();
  await user.click(searchInput);
  expect(searchInput).toHaveFocus();
  await user.keyboard(searchTerm);
  await user.keyboard("{Enter}");
}

/**
 * Asserts that the D3 graph is properly rendered in the DOM.
 * Checks for SVG element, circle nodes, and line edges.
 */
function assertGraphIsRendered(): void {
  const svgElement = document.querySelector("svg");
  expect(svgElement).toBeInTheDocument();

  const circles = document.querySelectorAll("circle");
  expect(circles.length).toBeGreaterThan(0);

  const lines = document.querySelectorAll("line");
  expect(lines.length).toBeGreaterThan(0);
}

/**
 * Finds all graph nodes that contain the specified text in their name (case-insensitive).
 *
 * @param text - The text to search for in node names.
 * @returns Array of SVG circle elements that match.
 */
function findNodesWithText(text: string): SVGCircleElement[] {
  const circles = document.querySelectorAll("circle");
  return Array.from(circles).filter((circle) => {
    const nodeData = (circle as unknown as { __data__: WBNode }).__data__;
    return nodeData.name.toLowerCase().includes(text.toLowerCase());
  }) as SVGCircleElement[];
}

/**
 * Finds the first graph node of the specified type.
 *
 * @param type - The node type to search for (e.g., "skill" or "url").
 * @returns The first matching SVG circle element, or undefined if none found.
 */
function findNodeByType(type: string): SVGCircleElement | undefined {
  const circles = document.querySelectorAll("circle");
  return Array.from(circles).find(
    (circle) => circle.getAttribute("type") === type,
  ) as SVGCircleElement | undefined;
}

/**
 * Counts the number of tree fetch requests in the given request array.
 *
 * @param requests - Array of request strings in format "METHOD URL".
 * @returns Count of GET requests to /tree endpoint.
 */
function countTreeRequests(requests: string[]): number {
  return requests.filter((req) => req === `GET ${BASE_URL}/tree`).length;
}
