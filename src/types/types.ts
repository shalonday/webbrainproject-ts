// Graph-related type definitions

export interface WBNode {
  uuid: string;
  type: "skill" | "url";
  name: string;
}

export interface Link {
  uuid: string;
  source: string;
  target: string;
}

export interface Tree {
  nodes: WBNode[];
  links: Link[];
}

// ========================================
// Chatbot-related type definitions
// ========================================

/**
 * Neo4j node types
 */
export interface SkillNode {
  uuid: string;
  name: string;
  embedding?: number[];
}

export interface URLNode {
  uuid: string;
  name: string;
  embedding?: number[];
}

export type GraphNode = SkillNode | URLNode;

/**
 * Relationship types
 */
export interface Relationship {
  type: "IS_PREREQUISITE_TO" | "TEACHES";
  source: string;
  target: string;
}

/**
 * Search result from similarity search
 */
export interface SearchResult {
  node: GraphNode;
  similarity: number;
  relatedNodes?: Relationship[];
}

/**
 * Chatbot message
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    sessionId?: string;
    relatedNodeIds?: string[];
  };
}

/**
 * Discord message payload
 */
export interface DiscordEmbedPayload {
  content?: string;
  embeds: Array<{
    title: string;
    description: string;
    fields: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    footer?: {
      text: string;
    };
    timestamp?: string;
  }>;
}

/**
 * Material request details
 */
export interface MaterialRequest {
  userIntent: string;
  userIdentification?: string;
  sessionId: string;
  timestamp: Date;
}

/**
 * Chat request to /chatbot/chat
 */
export interface ChatRequest {
  message: string;
  sessionId?: string;
  conversationHistory?: ChatMessage[];
  customInstructions?: string;
  context?: Record<string, unknown>;
}

/**
 * Chat response from /chatbot/chat
 */
export interface ChatResponse {
  message: string;
  relatedMaterials?: Array<{
    nodeId: string;
    name: string;
    type?: "skill" | "url";
  }>;
  suggestedActions?: string[];
  conversationState?: Record<string, unknown>;
}

// ========================================
// Progress persistence types
// ========================================

/**
 * Import strategies supported by the progress import UI and storage layer.
 */
export type ImportStrategy = "Merge" | "Replace" | "Study-Diff";

/**
 * Canonical shape of persisted progress stored in localStorage.
 * - All timestamps are ISO-8601 strings.
 */
export interface ProgressPayload {
  schemaVersion: string;
  lastUpdated: string; // ISO-8601 datetime when payload was written locally
  doneNodeTimestamps: Record<string, string>; // nodeId -> ISO-8601
  doneLinkTimestamps: Record<string, string>; // linkId -> ISO-8601
  markedForStudyNodeIds?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Result returned by import operations.
 */
export interface ImportResult {
  success: boolean;
  errors?: string[];
  payload?: ProgressPayload;
}

/**
 * Schema/validation result.
 */
export interface ValidationResult {
  ok: boolean;
  errors?: string[];
}
