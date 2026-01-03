import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { SkillTreesContextProvider } from "../../contexts/SkillTreesContext";
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
 *
 */

describe("Search input box", () => {
  // behavior is erratic; sometimes succeeds sometimes doesn't. Need to investigate !!!
  it("is focused when tab is pressed once", async () => {
    renderWithProviders(<Search />);

    const user = userEvent.setup();

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    const searchInput = screen.getByRole("textbox", { name: /search/i });
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

    const searchInput = screen.getByRole("textbox", { name: /search/i });
    // click focuses the searchInput
    expect(searchInput).toBeInTheDocument();
    await user.click(searchInput);
    expect(searchInput).toHaveFocus();
  });

  it("when focused, runs a search on the input value when Enter key is pressed", async () => {
    renderWithProviders(<Search />);

    // wait for loading screen to finish
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );

    const searchInput = screen.getByRole("textbox", { name: /search/i });

    const user = userEvent.setup();

    await user.tab();

    // type "javascript" then press Enter
    expect(searchInput).toHaveFocus();
    await user.keyboard("javascript");
    await user.keyboard("{Enter}"); // simulate pressing Enter after typing "foo"

    // wait for any loading to finish then assert that a result containing "foo" appears
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );
    await waitFor(
      () => expect(screen.getByText(/javascript/i)).toBeInTheDocument(),
      {
        timeout: 30000,
      }
    );

    // // expect the D3 svg node corresponding to the javascript skill node to be highlighted
    // const javascriptNode = screen.getByTestId("node-javascript");
    // expect(javascriptNode).toHaveClass("highlighted");
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

  // it("After a user confirms the keyword they're searching for, the resulting nodes are adequately highlighted", () => {
  //   throw new Error();
  // });

  // it("If there are no results, the user is informed", () => {
  //   throw new Error();
  // });

  // it("User can double click a skill node to select it", () => {
  //   throw new Error();
  // });

  // it("User can double click a URL node to select it", () => {
  //   throw new Error();
  // });
});

// describe("Search Page Text Results Display", () => {
// 	test("After a user confirms the keyword they're searching for, the results are displayed in text form", () => {
// 		throw new Error;
// 	});

// 	test("If there are no results, the user is informed", () => {
// 		throw new Error;
// 	});

// 	test("User can click on a skill description to select it", () => {
// 		throw new Error;
// 	});

// 	test("User can click on a URL result to select it", () => {
// 		throw new Error;
// 	});
// });

// describe("Generate Path Button", () => {
// 	test("Clicking on the button while a Skill or URL is selected leads user to the Branch page", () => {
// 		throw new Error;
// 	});

// 	test("Clicking on the button when there is nothing selected informs the user to select a Skill or URL first", () => {
// 		throw new Error;
// 	});
// });
