import type { ChatMessage } from "../../../types/types";

const STORAGE_KEY = "wbp_chatbot_session";

export interface ChatSession {
  messages: ChatMessage[];
  sessionId: string;
  lastUpdated: string;
}

/**
 * Load chat session from localStorage
 */
export function loadChatSession(): ChatSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored) as ChatSession;
      if (session.messages && Array.isArray(session.messages)) {
        return session;
      }
    }
  } catch (err) {
    console.error("Error loading conversation from localStorage:", err);
  }
  return null;
}

/**
 * Save chat session to localStorage
 */
export function saveChatSession(
  messages: ChatMessage[],
  sessionId: string,
): void {
  if (messages.length === 0) return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages,
        sessionId,
        lastUpdated: new Date().toISOString(),
      }),
    );
  } catch (err) {
    console.error("Error saving conversation to localStorage:", err);
  }
}

/**
 * Clear chat session from localStorage
 */
export function clearChatSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing conversation from localStorage:", err);
  }
}
