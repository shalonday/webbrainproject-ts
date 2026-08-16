import type { AxiosInstance } from "axios";
import axios from "axios";

import { BASE_URL } from "../common-constants";
import type {
  AnalyzeResponse,
  ChatRequest,
  ChatResponse,
  SearchResult,
} from "../types/types";
/**
 * API client for Perk API integration
 */
export class PerkAPIClient {
  private client: AxiosInstance;

  /**
   *
   */
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Send a chat message and get assistant response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.client.post("/chatbot/chat", request);
      return response.data;
    } catch (error) {
      console.error("Chat error:", error);
      throw error;
    }
  }

  /**
   * Search for skills/materials by similarity
   */
  async searchBySimilarity(
    query: string,
    limit: number = 10,
  ): Promise<SearchResult[]> {
    try {
      const response = await this.client.post("/chatbot/search", {
        query,
        limit,
      });
      // Backend returns { results, query, timestamp }
      return response.data.results;
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  /**
   * Submits a URL for content ingestion analysis.
   */
  async analyzeUrl(url: string): Promise<AnalyzeResponse> {
    try {
      const response = await this.client.post("/ingest/analyze", { url });
      return response.data as AnalyzeResponse;
    } catch (error) {
      console.error("Ingestion analysis error:", error);
      throw error;
    }
  }
}

/**
 * Create and return a PerkAPIClient instance
 */
export function createPerkAPIClient(baseURL?: string): PerkAPIClient {
  const url = baseURL || BASE_URL;
  return new PerkAPIClient(url);
}
