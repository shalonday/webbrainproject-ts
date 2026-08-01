import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ACTIVE_MODULE_FILL, ACTIVE_SKILL_FILL } from "../../common-constants";
import { server } from "../setup";
import {
  countPathRequests,
  getGraphNodeSnapshots,
  performSearch,
  renderSearchPage,
  waitForGraphToLoad,
} from "./searchTestUtils";

/**
 * Tests for the Generate Path button functionality.
 */
describe("Generate Path Button", () => {
  it(
    "is disabled when no search result is selected",
    { timeout: 20000 },
    async () => {
    renderSearchPage();
    const user = userEvent.setup();
    await waitForGraphToLoad();

    await performSearch(user, "javascript");

    const generateButton = screen.getByRole("button", {
      name: /generate learning path/i,
    });
    expect(generateButton).toBeDisabled();
    },
  );

  it("becomes enabled when a search result is selected", { timeout: 20000 }, async () => {
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
    await user.click(results[0]);

    const generateButton = screen.getByRole("button", {
      name: /generate learning path/i,
    });
    expect(generateButton).not.toBeDisabled();
  });

  it(
    "highlights the learning path when clicked with a selected result",
    { timeout: 40000 },
    async () => {
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
        await user.click(results[0]);

        const initialPathRequests = countPathRequests(requests);

        const generateButton = screen.getByRole("button", {
          name: /generate learning path/i,
        });

        await user.click(generateButton);

        // Wait for the path fetch to complete
        await waitFor(
          () =>
            expect(countPathRequests(requests)).toBeGreaterThan(
              initialPathRequests,
            ),
          { timeout: 10000 },
        );

        // Now check for highlights
        await waitFor(
          () => {
            const graphNodes = getGraphNodeSnapshots();
            const highlightedNodes = graphNodes.filter(
              (node) =>
                node.fill === ACTIVE_SKILL_FILL ||
                node.fill === ACTIVE_MODULE_FILL ||
                node.done,
            );

            expect(highlightedNodes.length).toBeGreaterThanOrEqual(2);

            const pathButtons = screen.getAllByRole("button").filter((button) =>
              (button.textContent || "").includes("Type:"),
            );
            expect(pathButtons.length).toBeGreaterThanOrEqual(3);
          },
          { timeout: 20000 },
        );
      } finally {
        server.events.removeAllListeners("request:start");
      }
    },
  );
});
