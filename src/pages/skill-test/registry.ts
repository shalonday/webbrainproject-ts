import type { SkillTestConfig } from "./types";

/**
 * Frontend-owned registry mapping skill node IDs to their test configuration.
 * Each entry determines what happens when a learner visits `/skill-test/:nodeId`.
 */
export const SKILL_TEST_REGISTRY: Record<string, SkillTestConfig> = {
  "cbd84b0c-35ca-407b-80eb-aaa04f327565": {
    nodeId: "cbd84b0c-35ca-407b-80eb-aaa04f327565",
    title: "count to 20",
    mode: "externalRedirect",
    externalUrl: "https://www.mathgames.com/skill/K.14-count-objects",
  },
  "3b16c249-0a8d-484c-ba14-90c611ccd077": {
    nodeId: "3b16c249-0a8d-484c-ba14-90c611ccd077",
    title:
      "identify the center of gravity versus the center of magnitude in a rotating body",
    mode: "internalDynamic",
    dynamicTemplateId: "3b16c249-0a8d-484c-ba14-90c611ccd077",
  },
};

/**
 * Looks up the skill test configuration for a given node ID.
 *
 * @param nodeId - The skill node UUID to resolve.
 * @returns The matching config, or null if not found.
 */
export function getSkillTestConfig(
  nodeId: string | undefined,
): SkillTestConfig | null {
  if (!nodeId) {
    return null;
  }
  return SKILL_TEST_REGISTRY[nodeId] ?? null;
}

/**
 * Checks whether a URL is allowed for external redirect (https only).
 *
 * @param url - The URL string to validate.
 * @returns True if the URL uses the https: protocol.
 */
export function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
