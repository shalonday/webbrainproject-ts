import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SkillTreesContextProvider } from "../../contexts/SkillTreesContext";
import Search from "../../pages/search/Search";
import { server } from "../setup";

/**
 * Renders the Search page with React Router using a specific route.
 *
 * @param initialEntries - The initial route path(s).
 */
function renderSearchPageWithRouter(initialEntries: string[] = ["/"]): void {
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
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/paths/:startId/:endId" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </SkillTreesContextProvider>
    </QueryClientProvider>,
  );
}

/**
 * Waits for the loading spinner to disappear.
 */
async function waitForGraphToLoad(): Promise<void> {
  await waitFor(
    () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
    { timeout: 30000 },
  );
}

/**
 * Tests for React Router integration.
 */
describe("React Router integration", () => {
  it("renders Search page at root route", async () => {
    renderSearchPageWithRouter(["/"]);
    await waitForGraphToLoad();

    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i,
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("renders Search page at /paths/:startId/:endId route", async () => {
    renderSearchPageWithRouter(["/paths/E/some-node-id"]);
    await waitForGraphToLoad();

    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i,
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("auto-generates path when URL contains endId param", async () => {
    const requests: string[] = [];

    /**
     *
     */
    const handleRequestStart = ({ request }: { request: Request }) => {
      requests.push(`${request.method} ${request.url}`);
    };

    server.events.on("request:start", handleRequestStart);

    try {
      // Use a real node ID from the mock data
      const endNodeId = "dc7161be-0000-8000-0000-018d39e8c7cd";
      renderSearchPageWithRouter([`/paths/E/${endNodeId}`]);

      await waitForGraphToLoad();

      // Wait a bit for the useEffect to trigger path generation
      await waitFor(
        () => {
          const pathRequests = requests.filter(
            (req) => req.includes("/paths/") && req.includes(endNodeId),
          );
          expect(pathRequests.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    } finally {
      server.events.removeAllListeners("request:start");
    }
  }, 60000);

  it("does not auto-generate path when URL has no endId param", async () => {
    const requests: string[] = [];

    /**
     *
     */
    const handleRequestStart = ({ request }: { request: Request }) => {
      requests.push(`${request.method} ${request.url}`);
    };

    server.events.on("request:start", handleRequestStart);

    try {
      renderSearchPageWithRouter(["/"]);
      await waitForGraphToLoad();

      // Wait a bit to ensure no path requests are made
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pathRequests = requests.filter((req) => req.includes("/paths/"));
      expect(pathRequests.length).toBe(0);
    } finally {
      server.events.removeAllListeners("request:start");
    }
  }, 60000);
});
