import { Alert, Box, CircularProgress, Paper } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import type { PerkAPIClient } from "../api/perkClient";
import { DEFAULT_START_NODE_ID } from "../constants/graph";
import type { ChatMessage } from "../types/types";
import { generateSessionId } from "../utils/common";
import { ChatInputArea } from "./chatbot/ChatInputArea";
import { formatAssistantMessage } from "./chatbot/helpers";
import { MessageBubble } from "./chatbot/MessageBubble";
import { loadChatSession, saveChatSession } from "./chatbot/storage";

export interface RAGChatbotProps {
  apiClient: PerkAPIClient;
  startNodeId?: string; // Default start node for path links (e.g., "E" for entry)
  sx?: object;
}

/**
 * Main RAG Chatbot Component
 *
 * Provides semantic search over Neo4j graph, clickable result links,
 * and Discord integration for material requests.
 */
export function RAGChatbot({
  apiClient,
  startNodeId = DEFAULT_START_NODE_ID, // Default to "E" (entry node)
  sx = {},
}: RAGChatbotProps) {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => generateSessionId());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const savedSession = loadChatSession();
    if (savedSession?.messages) {
      setMessages(savedSession.messages);
      return; // Skip welcome message if we have saved messages
    }

    // Add initial welcome message if no saved messages
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "msg-welcome",
        role: "assistant",
        content:
          "Hi! I'm the WBP Chatbot. I can help you search for learning materials or recommend new resources to add to the Web Brain Project. What would you like to explore?",
        timestamp: new Date(),
        metadata: { sessionId },
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    saveChatSession(messages, sessionId);
  }, [messages, sessionId]);

  /**
   * Handle user message submission
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
      metadata: {
        sessionId,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setError(null);
    setIsLoading(true);

    try {
      // Call chat endpoint with conversation history
      const conversationHistory = [...messages];
      const chatResponse = await apiClient.chat({
        message: inputValue,
        sessionId,
        conversationHistory,
        customInstructions: "",
      });
      console.log("chatResponse:", chatResponse);
      // Format assistant message with relatedMaterials as inline links
      const assistantContent = formatAssistantMessage(
        chatResponse,
        startNodeId,
      );

      // Create assistant response
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        metadata: {
          sessionId,
          relatedNodeIds: chatResponse.relatedMaterials?.map((m) => m.nodeId),
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error processing message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        ...sx,
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          padding: 2,
        }}
      >
        <h2 style={{ margin: 0 }}>Web Brain Project Chatbot</h2>
      </Paper>

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          padding: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: "center", marginTop: 4, color: "#999" }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <ChatInputArea
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </Box>
  );
}
