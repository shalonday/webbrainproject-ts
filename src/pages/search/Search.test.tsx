import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Search from "./Search";

/**
 *
 */

describe("Search input box", () => {
  // behavior is erratic; sometimes succeeds sometimes doesn't. Need to investigate !!!
  it("is focused when tab is pressed once", async () => {
    render(<Search />);

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
    render(<Search />);

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
    render(<Search />);
    const searchInput = screen.getByRole("textbox", { name: /search/i });
    fireEvent.focus(searchInput);

    const user = userEvent.setup();

    // type "foo" then press Enter
    expect(searchInput).toHaveFocus();
    await user.keyboard("javascript");
    await user.keyboard("{Enter}"); // simulate pressing Enter after typing "foo"

    // wait for any loading to finish then assert that a result containing "foo" appears
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 30000 }
    );
    await waitFor(() => expect(screen.getByText(/foo/i)).toBeInTheDocument(), {
      timeout: 30000,
    });

    // expect the D3 svg node corresponding to the javascript skill node to be highlighted
    const javascriptNode = screen.getByTestId("node-javascript");
    expect(javascriptNode).toHaveClass("highlighted");
  });
});

// describe("Search Page Graph Display", () => {
// 	test("After a user confirms the keyword they're searching for, the resulting nodes are adequately highlighted", () => {
// 		throw new Error;
// 	});

// 	test("If there are no results, the user is informed", () => {
// 		throw new Error;
// 	});

// 	test("User can double click a skill node to select it", () => {
// 		throw new Error;
// 	});

// 	test("User can double click a URL node to select it", () => {
// 		throw new Error;
// 	});
// });

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
