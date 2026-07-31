import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import React from "react";
import { expect } from "vitest";

import { BASE_URL } from "../../common-constants";
import { SkillTreesContextProvider } from "../../contexts/SkillTreesContext";
import Search from "../../pages/search/Search";
import { DEFAULT_START_NODE_ID } from "../../pages/search/search-utils";
import type { WBNode } from "../../types/types";

interface GraphNodeSnapshot {
  current: boolean;
  dimmed: boolean;
  done: boolean;
  fill: string | null;
  id: string;
  label: string;
  opacity: string | null;
  study: boolean;
  type: string;
}

interface GraphEdgeSnapshot {
  done: boolean;
  fill: string | null;
  id: string;
  inPath: boolean;
  opacity: string | null;
}

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
 * Finds the renderer-neutral observability root exposed by the graph renderer.
 *
 * @returns The hidden observability container, when rendered.
 */
function getGraphObservabilityRoot(): HTMLElement | null {
  return screen.queryByTestId("sigma-observability") as HTMLElement | null;
}

/**
 * Reads a renderer-neutral snapshot for a graph node element.
 *
 * @param element - The DOM element representing the node.
 * @returns A normalized node snapshot.
 */
function getGraphNodeSnapshot(element: Element): GraphNodeSnapshot {
  const dataNodeId = element.getAttribute("data-node-id");

  if (dataNodeId) {
    return {
      current: element.getAttribute("data-current") === "true",
      dimmed: element.getAttribute("data-opacity") !== "1",
      done: element.getAttribute("data-done") === "true",
      fill: element.getAttribute("data-fill"),
      id: dataNodeId,
      label: element.getAttribute("data-label") ?? "",
      opacity: element.getAttribute("data-opacity"),
      study: element.getAttribute("data-study") === "true",
      type: element.getAttribute("data-node-type") ?? "",
    };
  }

  const nodeData = (element as unknown as { __data__?: WBNode }).__data__;

  return {
    current: element.getAttribute("data-current") === "true",
    dimmed: element.getAttribute("opacity") !== "1",
    done: element.getAttribute("data-done") === "true",
    fill: element.getAttribute("fill"),
    id: nodeData?.uuid ?? "",
    label: nodeData?.name ?? "",
    opacity: element.getAttribute("opacity"),
    study: element.getAttribute("data-study") === "true",
    type: nodeData?.type ?? "",
  };
}

/**
 * Reads a renderer-neutral snapshot for a graph edge element.
 *
 * @param element - The DOM element representing the edge.
 * @returns A normalized edge snapshot.
 */
function getGraphEdgeSnapshot(element: Element): GraphEdgeSnapshot {
  const dataEdgeId = element.getAttribute("data-edge-id");

  if (dataEdgeId) {
    return {
      done: element.getAttribute("data-done") === "true",
      fill: element.getAttribute("data-fill"),
      id: dataEdgeId,
      inPath: element.getAttribute("data-in-path") === "true",
      opacity: element.getAttribute("data-opacity"),
    };
  }

  return {
    done: false,
    fill: element.getAttribute("stroke"),
    id: element.getAttribute("data-edge-id") ?? "",
    inPath: false,
    opacity: element.getAttribute("opacity"),
  };
}

/**
 * Collects the rendered graph node elements from either renderer.
 *
 * @returns The current node elements rendered in the graph.
 */
function getGraphNodeElements(): Element[] {
  const observabilityRoot = getGraphObservabilityRoot();

  if (observabilityRoot) {
    return Array.from(
      observabilityRoot.querySelectorAll(
        '[data-testid="sigma-nodes"] [data-node-id]',
      ),
    );
  }

  return Array.from(document.querySelectorAll("circle"));
}

/**
 * Collects the rendered graph edge elements from either renderer.
 *
 * @returns The current edge elements rendered in the graph.
 */
function getGraphEdgeElements(): Element[] {
  const observabilityRoot = getGraphObservabilityRoot();

  if (observabilityRoot) {
    return Array.from(
      observabilityRoot.querySelectorAll(
        '[data-testid="sigma-edges"] [data-edge-id]',
      ),
    );
  }

  return Array.from(document.querySelectorAll("line"));
}

/**
 * Returns normalized snapshots for all rendered graph nodes.
 *
 * @returns Array of graph node snapshots.
 */
export function getGraphNodeSnapshots(): GraphNodeSnapshot[] {
  return getGraphNodeElements().map(getGraphNodeSnapshot);
}

/**
 * Returns normalized snapshots for all rendered graph edges.
 *
 * @returns Array of graph edge snapshots.
 */
export function getGraphEdgeSnapshots(): GraphEdgeSnapshot[] {
  return getGraphEdgeElements().map(getGraphEdgeSnapshot);
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
 * Checks for renderer-neutral graph observability, falling back to SVG.
 */
export function assertGraphIsRendered(): void {
  const observabilityRoot = getGraphObservabilityRoot();

  if (observabilityRoot) {
    expect(observabilityRoot).toBeInTheDocument();
    expect(getGraphNodeElements().length).toBeGreaterThan(0);
    expect(getGraphEdgeElements().length).toBeGreaterThan(0);
    return;
  }

  const svgElement = document.querySelector("svg");
  expect(svgElement).toBeInTheDocument();

  expect(getGraphNodeElements().length).toBeGreaterThan(0);
  expect(getGraphEdgeElements().length).toBeGreaterThan(0);
}

/**
 * Finds all graph nodes that contain the specified text in their name (case-insensitive).
 *
 * @param text - The text to search for in node names.
 * @returns Array of SVG circle elements that match.
 */
export function findNodesWithText(text: string): Element[] {
  return getGraphNodeElements().filter((element) => {
    const snapshot = getGraphNodeSnapshot(element);
    return snapshot.label.toLowerCase().includes(text.toLowerCase());
  });
}

/**
 * Finds the first graph node of the specified type.
 *
 * @param type - The node type to search for (e.g., "skill" or "url").
 * @returns The first matching SVG circle element, or undefined if none found.
 */
export function findNodeByType(type: string): Element | undefined {
  return getGraphNodeElements().find((element) => {
    const snapshot = getGraphNodeSnapshot(element);
    return snapshot.type === type;
  });
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
    const currentNode = getGraphNodeSnapshots().find((node) => node.current);
    if (currentNode?.type === "skill" && currentNode.id !== DEFAULT_START_NODE_ID) {
      skillNodeFound = true;
      break;
    }

    if (moveForwardButton.hasAttribute("disabled")) {
      if (screen.queryByRole("dialog", { name: /skill assessment/i })) {
        skillNodeFound = true;
        break;
      }

      await waitFor(
        () => {
          const activeNode = getGraphNodeSnapshots().find((node) => node.current);
          if (activeNode?.type === "skill" && activeNode.id !== DEFAULT_START_NODE_ID) {
            skillNodeFound = true;
            return;
          }

          throw new Error("Move Forward button is disabled before a skill node was reached");
        },
        { timeout: 1000 },
      ).catch(() => {
        // If the button is disabled because the modal is open, the caller will handle it.
      });

      if (skillNodeFound) {
        break;
      }
    }

    await user.click(moveForwardButton);

    await waitFor(
      () => {
        const currentNode = getGraphNodeSnapshots().find(
          (node) => node.current,
        );
        if (!currentNode) {
          throw new Error("Current node not found");
        }

        const isSkillNode = currentNode.type === "skill";
        const isNotENode = currentNode.id !== DEFAULT_START_NODE_ID;

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
