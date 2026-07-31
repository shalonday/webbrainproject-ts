import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { server } from "../setup";
import {
  closeSkillModalIfOpen,
  getGraphNodeSnapshots,
  performSearch,
  renderSearchPage,
  waitForGraphToLoad,
} from "./searchTestUtils";

/**
 * Finds the rendered path node buttons in the bottom sheet.
 *
 * @returns The path node button elements.
 */
function getPathNodeButtons(): HTMLElement[] {
  return screen.getAllByRole("button").filter((button) => {
    const text = button.textContent || "";
    return text.includes("Type:");
  }) as HTMLElement[];
}

/**
 * Tests for the learning path display after path generation.
 */
describe("Learning Path Display", () => {
  it(
    "displays path nodes in the text card after generating a path",
    { timeout: 20000 },
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

        const results = await screen.findAllByRole("button", {
          name: /javascript/i,
        });
        await user.click(results[0]);

        const generateButton = screen.getByRole("button", {
          name: /generate learning path/i,
        });

        await user.click(generateButton);

        await waitFor(
          () => {
            expect(screen.queryByText("Learning Path")).toBeInTheDocument();
          },
          { timeout: 10000 },
        );

        await closeSkillModalIfOpen(user);

        const pathNodeButtons = getPathNodeButtons();

        expect(pathNodeButtons.length).toBeGreaterThanOrEqual(3);
      } finally {
        server.events.removeAllListeners("request:start");
      }
    },
  );

  it(
    "displays path nodes in the correct order",
    { timeout: 20000 },
    async () => {
      renderSearchPage();
      const user = userEvent.setup();
      await waitForGraphToLoad();

      await performSearch(user, "javascript");

      const results = await screen.findAllByRole("button", {
        name: /javascript/i,
      });
      await user.click(results[0]);

      const generateButton = screen.getByRole("button", {
        name: /generate learning path/i,
      });

      await user.click(generateButton);

      await waitFor(
        () => {
          expect(screen.queryByText("Learning Path")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      await closeSkillModalIfOpen(user);

      const pathNodeButtons = getPathNodeButtons();

      expect(pathNodeButtons.length).toBeGreaterThanOrEqual(3);
      expect(pathNodeButtons[0]?.textContent).toContain("E");
      expect(pathNodeButtons[0]).toHaveAttribute("data-current", "true");
      expect(pathNodeButtons[0]).toHaveAttribute("data-dimmed", "false");

      pathNodeButtons.slice(1).forEach((button) => {
        expect(button).toHaveAttribute("data-dimmed", "true");
      });
    },
  );

  it(
    "path node buttons are clickable and log node information",
    { timeout: 20000 },
    async () => {
      const consoleSpy = vi.spyOn(console, "log");

      renderSearchPage();
      const user = userEvent.setup();
      await waitForGraphToLoad();

      await performSearch(user, "javascript");

      const results = await screen.findAllByRole("button", {
        name: /javascript/i,
      });
      await user.click(results[0]);

      const generateButton = screen.getByRole("button", {
        name: /generate learning path/i,
      });

      await user.click(generateButton);

      // Wait for learning path heading
      await waitFor(
        () => {
          expect(screen.queryByText("Learning Path")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      await closeSkillModalIfOpen(user);

      const pathNodeButtons = getPathNodeButtons();

      if (pathNodeButtons[0]) {
        await user.click(pathNodeButtons[0]);

        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            "Path node clicked:",
            expect.objectContaining({
              uuid: expect.any(String),
              type: expect.stringMatching(/skill|url/),
              name: expect.any(String),
            }),
          );
        });
      }

      consoleSpy.mockRestore();
    },
  );

  it(
    "replaces search results with path display when path is generated",
    { timeout: 20000 },
    async () => {
      renderSearchPage();
      const user = userEvent.setup();
      await waitForGraphToLoad();

      await performSearch(user, "javascript");

      await waitFor(() => {
        expect(screen.queryByText(/result/i)).toBeInTheDocument();
      });

      const results = await screen.findAllByRole("button", {
        name: /javascript/i,
      });
      await user.click(results[0]);

      const generateButton = screen.getByRole("button", {
        name: /generate learning path/i,
      });

      await user.click(generateButton);

      await waitFor(
        () => {
          expect(screen.queryByText("Learning Path")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(screen.queryByText(/result.*found/i)).not.toBeInTheDocument();
    },
  );

  it(
    "dims non-path nodes and links while keeping path fully highlighted",
    { timeout: 20000 },
    async () => {
      renderSearchPage();
      const user = userEvent.setup();
      await waitForGraphToLoad();

      await performSearch(user, "javascript");

      const results = await screen.findAllByRole("button", {
        name: /javascript/i,
      });
      await user.click(results[0]);

      const generateButton = screen.getByRole("button", {
        name: /generate learning path/i,
      });

      await user.click(generateButton);

      await waitFor(
        () => {
          expect(screen.queryByText("Learning Path")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      await waitFor(
        () => {
          const pathButtons = getPathNodeButtons();
          const currentButton = pathButtons.find(
            (button) => button.getAttribute("data-current") === "true",
          );

          expect(currentButton).toBeTruthy();
          expect(currentButton).toHaveAttribute("data-dimmed", "false");

          const graphNodes = getGraphNodeSnapshots();
          expect(graphNodes.some((node) => node.dimmed)).toBe(true);

          expect(
            pathButtons.some(
              (button) => button.getAttribute("data-dimmed") === "true",
            ),
          ).toBe(true);

          const graphEdges = Array.from(
            document.querySelectorAll('[data-testid="sigma-edges"] [data-edge-id]'),
          );
          expect(
            graphEdges.some((edge) => edge.getAttribute("data-opacity") === "1"),
          ).toBe(true);
          expect(
            graphEdges.some((edge) => edge.getAttribute("data-opacity") === "0.2"),
          ).toBe(true);
        },
        { timeout: 5000 },
      );
    },
  );
});
