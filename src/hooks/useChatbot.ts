import { useCallback, useRef, useState } from "react";

import { PerkAPIClient } from "../api/perkClient";
import type { ChatMessage, SearchResult } from "../types/types";
import { generateSessionId } from "../utils/common";

interface UseChatbotOptions {
  apiClient: PerkAPIClient;
}

/**
 *
 */
export function useChatbot(options: UseChatbotOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef(generateSessionId());

  const addMessage = useCallback(
    (
      role: "user" | "assistant",
      content: string,
      metadata?: ChatMessage["metadata"],
    ) => {
      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
        metadata,
      };
      setMessages((prev) => [...prev, message]);
      return message;
    },
    [],
  );

  const search = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      try {
        setIsLoading(true);
        setError(null);
        const results = await options.apiClient.searchBySimilarity(query);
        return results;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Search failed";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [options.apiClient],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId: sessionIdRef.current,
    addMessage,
    search,
    clear,
  };
}
