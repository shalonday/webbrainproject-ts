import type { ChatResponse } from "../../types/types";
import { buildPathLink } from "../../utils/pathLinks";

/**
 * Format assistant message with relatedMaterials as inline markdown links
 */
export function formatAssistantMessage(
  response: ChatResponse,
  startNodeId: string,
): string {
  let content = response.message;

  // If relatedMaterials exist, append them as clickable links
  if (response.relatedMaterials && response.relatedMaterials.length > 0) {
    const materialsLinks = response.relatedMaterials
      .map((material) => {
        const link = buildPathLink(startNodeId, material.nodeId);
        return `[${material.name}](${link})`;
      })
      .join(", ");

    // Append materials to the message content
    content = `${content}\n\nRelated materials: ${materialsLinks}`;
  }

  return content;
}

/**
 * Parse markdown-style links [text](url) from a text line and return
 * an array of text strings and link objects
 */
export function parseMarkdownLinks(
  line: string,
): Array<string | { text: string; url: string }> {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts: Array<string | { text: string; url: string }> = [];
  let lastIndex = 0;

  let match;
  while ((match = linkRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    parts.push({ text: match[1], url: match[2] });
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [line];
}
