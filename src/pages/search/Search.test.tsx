import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ReactElement } from "react";
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

/**
 * Custom render function that wraps components with necessary providers.
 *
 * @param ui - The component to render.
 * @param options - Optional render options.
 * @returns The render result from @testing-library/react.
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SkillTreesContextProvider>{ui}</SkillTreesContextProvider>
    </QueryClientProvider>,
    options
  );
}

/**
 * Tests for the Search input box functionality.
 */

describe("Search input box", () => {
  it("is focused when tab is pressed once", async () => {
    renderWithProviders(<Search />);

    const user = userEvent.setup();

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i
    );
    // single tab focuses the searchInput
    expect(searchInput).toBeInTheDocument();

    expect(document.body).toHaveFocus();
    await user.tab();
    expect(searchInput).toHaveFocus();
  });

  it("is focused when clicked", async () => {
    renderWithProviders(<Search />);

    const user = userEvent.setup();

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i
    );
    // click focuses the searchInput
    expect(searchInput).toBeInTheDocument();
    await user.click(searchInput);
    expect(searchInput).toHaveFocus();
  });

  it("when focused, pressing Enter filters locally without refetching", async () => {
    const requests: string[] = [];

    /**
     * Collects each MSW-captured request so the test can assert a fetch occurred.
     */
    const handleRequestStart = ({ request }: { request: Request }) => {
      requests.push(`${request.method} ${request.url}`);
    };

    server.events.on("request:start", handleRequestStart);

    try {
      renderWithProviders(<Search />);

      // wait for loading screen to finish
      await waitFor(
        () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
        { timeout: 30000 }
      );

      const initialTreeRequests = requests.filter(
        (req) => req === `GET ${BASE_URL}/tree`
      ).length;

      const searchInput = screen.getByPlaceholderText(
        /search for a skill or url/i
      );

      const user = userEvent.setup();

      // focus the search input
      await user.click(searchInput);

      // type "javascript" then press Enter
      expect(searchInput).toHaveFocus();
      await user.keyboard("javascript");
      await user.keyboard("{Enter}");

      // pressing Enter should not trigger another fetch; it filters locally
      await waitFor(
        () =>
          expect(
            requests.filter((req) => req === `GET ${BASE_URL}/tree`).length
          ).toBe(initialTreeRequests),
        { timeout: 30000 }
      );
    } finally {
      server.events.removeAllListeners("request:start");
    }
  }, 60000);
});

describe("Search Page Graph Display", () => {
  it("loads and displays the universal tree when entering the search page", async () => {
    renderWithProviders(<Search />);

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    // Check that SVG elements are rendered (indicating the graph is displayed)
    const svgElement = document.querySelector("svg");
    expect(svgElement).toBeInTheDocument();

    // Check that graph nodes (circles) are rendered
    const circles = document.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThan(0);

    // Check that graph links (lines) are rendered
    const lines = document.querySelectorAll("line");
    expect(lines.length).toBeGreaterThan(0);
  });

  it("After a user confirms the keyword they're searching for, the resulting nodes are adequately highlighted", async () => {
    renderWithProviders(<Search />);

    const user = userEvent.setup();

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    // Get the search input and type a search term
    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i
    );
    await user.click(searchInput);
    await user.keyboard("javascript");
    await user.keyboard("{Enter}");

    // Wait for highlighting to occur after pressing Enter
    await waitFor(
      () => {
        const circles = document.querySelectorAll("circle");
        // Find all nodes with "javascript" in the name
        const allJavascriptNodes = Array.from(circles).filter((circle) => {
          const nodeData = (circle as unknown as { __data__: WBNode }).__data__;
          return nodeData.name.toLowerCase().includes("javascript");
        });

        // Assert there are some javascript nodes
        expect(allJavascriptNodes.length).toBeGreaterThan(0);

        // Assert ALL of them are highlighted
        allJavascriptNodes.forEach((node) => {
          const fill = node.getAttribute("fill");
          expect(
            fill === ACTIVE_SKILL_FILL || fill === ACTIVE_MODULE_FILL
          ).toBe(true);
        });
      },
      { timeout: 30000 }
    );
  });

  // it("If there are no results, the user is informed", () => {
  //   throw new Error();
  // });

  it("highlights a clicked node", async () => {
    renderWithProviders(<Search />);

    // render the universal tree first
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );
    const svgElement = document.querySelector("svg");
    expect(svgElement).toBeInTheDocument();
    const circles = document.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThan(0);
    const lines = document.querySelectorAll("line");
    expect(lines.length).toBeGreaterThan(0);

    // click on a skill node
    const user = userEvent.setup();
    const firstCircle = circles[0];
    await user.click(firstCircle);

    // check that the skill node is highlighted
    expect(firstCircle).toHaveAttribute("fill", ACTIVE_SKILL_FILL);

    // click on a URL node
    const urlNode = Array.from(circles).find(
      (circle) => circle.getAttribute("type") === "url"
    );
    // check that the URL node is highlighted
    if (urlNode) {
      await user.click(urlNode);
      expect(urlNode).toHaveAttribute("fill", ACTIVE_MODULE_FILL);
    }
  });

  // it("User can double click a URL node to select it", () => {
  //   throw new Error();
  // });
});

describe("Search Page Text Results Display", () => {
  it("After a user confirms the keyword they're searching for, the results are displayed in text form", async () => {
    renderWithProviders(<Search />);

    const user = userEvent.setup();

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    // Search for "javascript"
    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i
    );
    await user.click(searchInput);
    await user.keyboard("javascript");
    await user.keyboard("{Enter}");

    // Wait for results to appear in the card
    const results = await screen.findAllByRole("button", {
      name: /javascript/i,
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it("If there are no results, the user is informed", async () => {
    renderWithProviders(<Search />);

    const user = userEvent.setup();

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    // Search for something that won't match
    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i
    );
    await user.click(searchInput);
    await user.keyboard("xyzabc123");
    await user.keyboard("{Enter}");

    // Wait for "no results" message to appear
    await screen.findByText(/no results found/i);
  });

  // test("User can click on a skill description to select it", () => {
  // 	throw new Error;
  // });

  // test("User can click on a URL result to select it", () => {
  // 	throw new Error;
  // });
});

// describe("Generate Path Button", () => {
// 	test("Clicking on the button while a Skill or URL is selected leads user to the Branch page", () => {
// 		throw new Error;
// 	});

// 	test("Clicking on the button when there is nothing selected informs the user to select a Skill or URL first", () => {
// 		throw new Error;
// 	});
// });
