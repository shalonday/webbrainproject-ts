/**
 * Utility to generate a unique session ID.
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Utility to format a date.
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Check if a string is a valid UUID (v1-v5).
 */
export function isValidNodeId(id: string): boolean {
  if (typeof id !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
