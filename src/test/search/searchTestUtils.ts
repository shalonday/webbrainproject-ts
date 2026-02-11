import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import React from "react";
import { expect } from "vitest";

import { BASE_URL } from "../../common-constants";
import { SkillTreesContextProvider } from "../../contexts/SkillTreesContext";
import Search from "../../pages/search/Search";
import type { WBNode } from "../../types/types";

/**
 * Renders the Search page component with all necessary providers.
 */
export function renderSearchPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        SkillTreesContextProvider,
        null,
        React.createElement(Search),
      ),
    ),
  );
}

/**
 * Waits for the loading spinner to disappear, indicating the graph has loaded.
 *
 * @throws {Error} If the graph doesn't load within the timeout period.
 */
export async function waitForGraphToLoad(): Promise<void> {
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
export function getSearchInput(): HTMLElement {
  return screen.getByPlaceholderText(/search for a skill or url/i);
}

/**
 * Performs a complete search operation: click input, type search term, press Enter.
 *
 * @param user - The userEvent instance for interaction.
 * @param searchTerm - The term to search for.
 */
export async function performSearch(
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
export function assertGraphIsRendered(): void {
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
export function findNodesWithText(text: string): SVGCircleElement[] {
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
export function findNodeByType(type: string): SVGCircleElement | undefined {
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
export function countTreeRequests(requests: string[]): number {
  return requests.filter((req) => req === `GET ${BASE_URL}/tree`).length;
}

/**
 * Counts the number of path fetch requests in the given request array.
 *
 * @param requests - Array of request strings in format "METHOD URL".
 * @returns Count of GET requests to /paths endpoint.
 */
export function countPathRequests(requests: string[]): number {
  return requests.filter((req) => req.includes(`${BASE_URL}/paths`)).length;
}

/**
 * Closes the skill modal if it's open, allowing tests to proceed past skill nodes.
 *
 * @param user - The userEvent instance for interaction.
 */
export async function closeSkillModalIfOpen(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  try {
    const closeButton = screen.queryByRole("button", { name: /close/i });
    // Check if it's the close button from the skill modal (not some other close button)
    if (closeButton && closeButton.closest('[aria-labelledby*="_r_"]')) {
      await user.click(closeButton);
      // Wait for modal to close
      await waitFor(
        () => {
          const modal = screen.queryByRole("dialog", {
            name: /skill assessment/i,
          });
          expect(modal).not.toBeInTheDocument();
        },
        { timeout: 500 },
      );
    }
  } catch {
    // Modal wasn't open, continuing...
  }
}

/**
 * Navigates to the next skill node in the path by clicking Move Forward.
 *
 * @param user - The userEvent instance for interaction.
 * @param moveForwardButton - The Move Forward button element.
 */
export async function navigateToSkillNode(
  user: ReturnType<typeof userEvent.setup>,
  moveForwardButton: HTMLElement,
  options?: {
    maxAttempts?: number;
  },
): Promise<void> {
  const maxAttempts = options?.maxAttempts ?? 10;
  let skillNodeFound = false;
  let attempts = 0;

  while (!skillNodeFound && attempts < maxAttempts) {
    await user.click(moveForwardButton);

    await waitFor(
      () => {
        // The current node is marked on the D3 chart.
        const currentNode = document.querySelector(
          'circle[data-current="true"]',
        ) as SVGCircleElement | null;
        if (!currentNode) {
          throw new Error("Current node not found");
        }

        const nodeData = (currentNode as unknown as { __data__?: WBNode })
          .__data__;
        if (!nodeData) {
          throw new Error("Current node data not found");
        }

        const isSkillNode = nodeData.type === "skill";
        const isNotENode = nodeData.name !== "E";

        if (isSkillNode && isNotENode) {
          skillNodeFound = true;
        }
      },
      { timeout: 500 },
    ).catch(() => {
      // If it times out, we didn't land on a matching skill node yet
    });

    attempts++;
  }
}
