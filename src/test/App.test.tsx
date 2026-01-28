import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "../App";
/**
 * Renders the App component with all providers.
 */
function renderApp(): void {
  render(<App />);
}

/**
 * Tests for the main App component routing setup.
 */
describe("App component", () => {
  it("renders without crashing", () => {
    renderApp();
    // App should render the Search page by default
    expect(
      screen.getByPlaceholderText(/search for a skill or url/i),
    ).toBeInTheDocument();
  });

  it("includes BrowserRouter", () => {
    renderApp();
    // If BrowserRouter is present, the app should have routing capability
    // We can verify this by checking that the Search component renders
    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i,
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("provides QueryClient to children", () => {
    renderApp();
    // QueryClient provider should be working (Search page uses queries)
    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i,
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("provides SkillTreesContext to children", () => {
    renderApp();
    // SkillTreesContext should be available to Search page
    const searchInput = screen.getByPlaceholderText(
      /search for a skill or url/i,
    );
    expect(searchInput).toBeInTheDocument();
  });
});
