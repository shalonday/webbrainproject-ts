import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { AnalyzeResponse } from "../../types/types";
import Edit from "./Edit";

const sigmaInstances =
  (
    globalThis as {
      __sigmaMockInstances?: Array<{
        graph: {
          nodes: () => string[];
          getNodeAttributes: (node: string) => { label: string };
        };
        handlers: Record<string, (event: { node: string }) => void>;
      }>;
    }
  ).__sigmaMockInstances ?? [];

const response: AnalyzeResponse = {
  content: "Lesson content",
  objectives: [{ name: "New skill", uuid: null }],
  prerequisites: [
    {
      assessmentUrls: ["https://example.com/existing"],
      name: "Existing skill",
      uuid: "existing-skill",
    },
  ],
  title: "Lesson",
  url: "https://example.com/lesson",
};

/** Renders the edit route with analyzed skills. */
function renderEdit() {
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: "/edit", state: { analyzeResponse: response } },
      ]}
    >
      <Routes>
        <Route element={<Edit />} path="/edit" />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * Sends a node click to the active mock renderer.
 *
 * @param node - The graph node ID.
 */
function clickNode(node: string) {
  act(() => sigmaInstances.at(-1)!.handlers.clickNode({ node }));
}

afterEach(() => {
  sigmaInstances.length = 0;
});

describe("Edit skill interactions", () => {
  it("renames new skills without changing their graph IDs and retains added URLs", async () => {
    const user = userEvent.setup();
    renderEdit();
    const nodeId = "candidate-skill:New%20skill";
    clickNode(nodeId);
    const name = screen.getByRole("textbox", { name: "Skill name" });
    await user.clear(name);
    await user.type(name, "Renamed skill");
    await user.type(
      screen.getByRole("textbox", { name: "Assessment URL" }),
      "https://example.com/new",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sigmaInstances.at(-1)!.graph.getNodeAttributes(nodeId).label).toBe(
      "Renamed skill",
    );
    clickNode(nodeId);
    expect(screen.getByRole("textbox", { name: "Skill name" })).toHaveValue(
      "Renamed skill",
    );
    expect(screen.getByText("https://example.com/new")).toBeInTheDocument();
  });

  it("locks existing names and appends without removing existing URLs", async () => {
    const user = userEvent.setup();
    renderEdit();
    clickNode("existing-skill");
    expect(screen.getByRole("textbox", { name: "Skill name" })).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: "Assessment URL" }),
      "https://example.com/second",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    clickNode("existing-skill");
    const list = screen.getByRole("list", { name: "Assessment URLs" });
    expect(
      within(list).getByText("https://example.com/existing"),
    ).toBeInTheDocument();
    expect(
      within(list).getByText("https://example.com/second"),
    ).toBeInTheDocument();
    expect(within(list).queryByRole("button")).not.toBeInTheDocument();
  });

  it("rejects invalid and duplicate URLs and discards cancelled edits", async () => {
    const user = userEvent.setup();
    renderEdit();
    clickNode("existing-skill");
    const input = screen.getByRole("textbox", { name: "Assessment URL" });
    await user.type(input, "invalid");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(
      screen.getByText("Enter a valid HTTP or HTTPS URL."),
    ).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "https://example.com/existing");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(
      screen.getByText("This assessment URL has already been added."),
    ).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "https://example.com/discarded");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    clickNode("existing-skill");
    expect(
      screen.queryByText("https://example.com/discarded"),
    ).not.toBeInTheDocument();
  });

  it("does not open the editor for URL nodes", () => {
    renderEdit();
    const graph = sigmaInstances.at(-1)!.graph;
    const urlId = graph
      .nodes()
      .find((node) => graph.getNodeAttributes(node).label === response.url)!;
    clickNode(urlId);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
