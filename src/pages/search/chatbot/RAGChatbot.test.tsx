import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PerkAPIClient } from "../../../api/perkClient";
import { BASE_URL } from "../../../common-constants";
import { DEFAULT_START_NODE_ID } from "../../../constants/graph";
import { RAGChatbot } from "./RAGChatbot";

// Constants for test data
const WELCOME_MESSAGE_REGEX = /Hi! I'm the WBP Chatbot/i;

/**
 * Helper function to create a mock API client for testing
 */
function createMockClient(): PerkAPIClient {
  return new PerkAPIClient(BASE_URL);
}

/**
 * Helper function to render the RAGChatbot component with a mock client
 */
function renderChatbot(apiClient?: PerkAPIClient) {
  const client = apiClient || createMockClient();
  return render(<RAGChatbot apiClient={client} />);
}

describe("RAGChatbot", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  /**
   * Test that the chatbot renders with the initial welcome message
   */
  it("renders with welcome message", async () => {
    renderChatbot();

    await waitFor(() => {
      expect(screen.getByText(WELCOME_MESSAGE_REGEX)).toBeInTheDocument();
    });
  });

  /**
   * Test that the message input field is rendered
   */
  it("renders message input", () => {
    renderChatbot();

    expect(
      screen.getByPlaceholderText(/Ask about learning materials/i),
    ).toBeInTheDocument();
  });

  /**
   * Test that sending a message triggers the chat API and displays the response
   */
  it("sends message and receives response", async () => {
    const user = userEvent.setup();
    renderChatbot();

    const input = screen.getByPlaceholderText(/Ask about learning materials/i);
    await user.type(input, "javascript");

    const sendButton = screen.getByLabelText("send message");
    await user.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/You asked about: javascript/),
      ).toBeInTheDocument();
    });
  });

  /**
   * Test that relatedMaterials from the chat response are rendered as clickable links
   */
  it(
    "renders inline relatedMaterials as clickable links",
    { timeout: 20000 },
    async () => {
    // Mock the chat method to return relatedMaterials
    const mockClient = new PerkAPIClient(BASE_URL);
    vi.spyOn(mockClient, "chat").mockResolvedValue({
      message: "Here are some resources for learning JavaScript:",
      relatedMaterials: [
        {
          nodeId: "node-1",
          name: "JavaScript Basics",
          type: "url",
        },
        {
          nodeId: "node-2",
          name: "Advanced JS",
          type: "url",
        },
      ],
    });

    const user = userEvent.setup();
    render(<RAGChatbot apiClient={mockClient} />);

    const input = screen.getByPlaceholderText(/Ask about learning materials/i);
    await user.type(input, "javascript resources");

    const sendButton = screen.getByLabelText("send message");
    await user.click(sendButton);

    // Wait for response with links
    await waitFor(() => {
      const link1 = screen.getByText("JavaScript Basics");
      const link2 = screen.getByText("Advanced JS");

      expect(link1).toBeInTheDocument();
      expect(link2).toBeInTheDocument();

      // Check that they are links
      expect(link1.tagName).toBe("A");
      expect(link2.tagName).toBe("A");

      // Check href attributes point to internal path links
      const expected1 = `/paths/${encodeURIComponent(
        DEFAULT_START_NODE_ID,
      )}/${encodeURIComponent("node-1")}`;
      const expected2 = `/paths/${encodeURIComponent(
        DEFAULT_START_NODE_ID,
      )}/${encodeURIComponent("node-2")}`;

      expect(link1).toHaveAttribute("href", expected1);
      expect(link2).toHaveAttribute("href", expected2);
    }, { timeout: 10000 });
    },
  );
});
