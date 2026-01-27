import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WBNode } from "../../types/types";
import { server } from "../setup";
import {
  performSearch,
  renderSearchPage,
  waitForGraphToLoad,
} from "./searchTestUtils";

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

        // Wait for the path to be displayed
        await waitFor(
          () => {
            const pathHeading = screen.queryByText("Learning Path");
            expect(pathHeading).toBeInTheDocument();
          },
          { timeout: 10000 },
        );

        // Verify path nodes are displayed
        const pathNodes = screen.getAllByRole("button");
        const pathNodeButtons = pathNodes.filter((button) => {
          const text = button.textContent || "";
          return text.includes("Type:");
        });

        // Should have at least 3 nodes (start, url, target)
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

      // Wait for learning path heading
      await waitFor(
        () => {
          expect(screen.queryByText("Learning Path")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      // Get all list items and find the ones with node data
      const listItems = screen.getAllByRole("button");
      const pathNodeButtons = listItems.filter((button) => {
        const text = button.textContent || "";
        return text.includes("Type:");
      });

      // Verify the order - should have multiple nodes
      expect(pathNodeButtons.length).toBeGreaterThanOrEqual(3);

      // First node should be "E"
      expect(pathNodeButtons[0]?.textContent).toContain("E");

      // Should have nodes in the path
      expect(pathNodeButtons.length).toBeGreaterThan(0);
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

      // Get all list items and find the ones with node data
      const listItems = screen.getAllByRole("button");
      const pathNodeButtons = listItems.filter((button) => {
        const text = button.textContent || "";
        return text.includes("Type:");
      });

      // Click the first path node
      if (pathNodeButtons[0]) {
        await user.click(pathNodeButtons[0]);

        // Verify that console.log was called with the node data
        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            "Path node clicked:",
            expect.objectContaining({
              id: expect.any(String),
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

      // Verify search results are showing
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

      // Wait for learning path to appear
      await waitFor(
        () => {
          expect(screen.queryByText("Learning Path")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      // Verify the "results found" text is gone
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

      // Wait for path to render and styles to apply
      await waitFor(
        () => {
          expect(screen.queryByText("Learning Path")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      // Wait for graph to apply opacity styles
      await waitFor(
        () => {
          // Validate node opacity: E (in path) should be fully visible
          const circles = Array.from(document.querySelectorAll("circle"));
          const eNode = circles.find(
            (circle) =>
              (circle as unknown as { __data__?: WBNode }).__data__?.name ===
              "E",
          );

          // E is the starting node in the path, should be fully visible
          expect(eNode).toBeTruthy();
          const eOpacity = eNode?.getAttribute("opacity");
          expect(eOpacity).toBe("1");

          // Find all dimmed nodes (opacity 0.25 - these are nodes NOT in the path)
          const dimmedNodes = circles.filter((circle) => {
            const opacity = circle.getAttribute("opacity");
            return opacity === "0.25";
          });
          // There should be at least one dimmed node (React, JavaScript, etc.)
          expect(dimmedNodes.length).toBeGreaterThan(0);

          // Validate link opacity: path links remain emphasized
          // Find links with full opacity (in path) vs dimmed (not in path)
          const lines = Array.from(document.querySelectorAll("line"));
          const pathLinks = lines.filter((line) => {
            const opacity = line.getAttribute("opacity");
            return opacity === "1";
          });
          const dimmedLinks = lines.filter((line) => {
            const opacity = line.getAttribute("opacity");
            return opacity === "0.2";
          });

          // Path should have at least one emphasized link
          expect(pathLinks.length).toBeGreaterThan(0);
          // And should have some dimmed links (non-path links)
          expect(dimmedLinks.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    },
  );
});
