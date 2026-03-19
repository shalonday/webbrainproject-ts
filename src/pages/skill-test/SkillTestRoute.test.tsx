import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SKILL_TEST_REGISTRY } from "./registry";
import { SkillTestRoute } from "./SkillTestRoute";

let assignMock: ReturnType<typeof vi.fn>;

/**
 * Renders the skill-test route with a specific initial path.
 *
 * @param initialPath - The route to render.
 */
function renderSkillTestRoute(initialPath: string): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/skill-test/:nodeId" element={<SkillTestRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

/*
 * Each test runs in jsdom where `window.location.assign` causes navigation
 * (and may be non-writable). We need to observe calls to `location.assign`
 * without performing a real navigation. The beforeEach below creates a fresh
 * mock (`assignMock`) for every test and stubs the global `location` object,
 * replacing only the `assign` property so tests can assert redirects safely.
 */
beforeEach(() => {
  assignMock = vi.fn();
  vi.stubGlobal("location", {
    ...window.location,
    assign: assignMock,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SkillTestRoute", () => {
  it("renders external redirect UI and CTA for known external node ID", async () => {
    const nodeId = "cbd84b0c-35ca-407b-80eb-aaa04f327565";
    const externalConfig = SKILL_TEST_REGISTRY[nodeId];

    if (!externalConfig || externalConfig.mode !== "externalRedirect") {
      throw new Error(
        "Expected externalRedirect config for known external node",
      );
    }

    renderSkillTestRoute(`/skill-test/${nodeId}`);

    expect(
      screen.getByText(/redirecting you to practice/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open practice link/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith(externalConfig.externalUrl);
    });
  });

  it("renders internal dynamic page and Done button for known internal node ID", () => {
    const nodeId = "3b16c249-0a8d-484c-ba14-90c611ccd077";
    renderSkillTestRoute(`/skill-test/${nodeId}`);

    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /identify the center of gravity versus the center of magnitude/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders not-configured fallback with node ID for unknown node", () => {
    const unknownNodeId = "00000000-0000-0000-0000-000000000000";
    renderSkillTestRoute(`/skill-test/${unknownNodeId}`);

    expect(screen.getByText(/skill test not configured/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(unknownNodeId, "i")),
    ).toBeInTheDocument();
  });
});
