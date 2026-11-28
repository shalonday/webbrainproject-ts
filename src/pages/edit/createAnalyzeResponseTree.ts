import type {
  AnalyzedSkill,
  AnalyzeResponse,
  Link,
  Tree,
  WBNode,
} from "../../types/types";

/**
 * Creates a stable graph ID for a skill in an analysis response. Use a non-uuid string for new candidate skills; preexisting skills obtained from DB are true uuids that don't start with "candidate-skill"
 *
 * @param skill - The analyzed skill to identify.
 * @returns The existing UUID or a candidate ID derived from its name.
 */
function getAnalyzedSkillId(skill: AnalyzedSkill): string {
  return skill.uuid ?? `candidate-skill:${encodeURIComponent(skill.name)}`;
}

/**
 * Rejects skills assigned to both sides of the analyzed URL.
 *
 * @param analyzeResponse - The response whose skill groups are validated.
 */
function validateSkillGroups(analyzeResponse: AnalyzeResponse): void {
  const prerequisiteIds = new Set(
    analyzeResponse.prerequisites.map(getAnalyzedSkillId),
  );
  const sharedSkill = analyzeResponse.objectives.find((skill) =>
    prerequisiteIds.has(getAnalyzedSkillId(skill)),
  );

  if (sharedSkill) {
    throw new Error(
      `Skill "${sharedSkill.name}" cannot be both a prerequisite and an objective`,
    );
  }
}

/**
 * Adds analyzed skills and their directed links to the graph collections.
 *
 * @param skills - Skills on one side of the analyzed URL.
 * @param direction - Whether these skills are prerequisites or objectives.
 * @param urlId - The generated node ID for the analyzed URL.
 * @param nodes - Nodes accumulated for the graph.
 * @param links - Links accumulated for the graph.
 */
function addAnalyzedSkillsToTree(
  skills: AnalyzedSkill[],
  direction: "prerequisite" | "objective",
  urlId: string,
  nodes: Map<string, WBNode>,
  links: Map<string, Link>,
): void {
  for (const skill of skills) {
    const skillId = getAnalyzedSkillId(skill);
    if (!nodes.has(skillId)) {
      nodes.set(skillId, {
        ...(skill.assessmentUrls != null
          ? { assessmentUrls: [...skill.assessmentUrls] }
          : {}),
        name: skill.name,
        type: "skill",
        uuid: skillId,
      });
    }

    const source = direction === "prerequisite" ? skillId : urlId;
    const target = direction === "prerequisite" ? urlId : skillId;
    const linkKey = JSON.stringify([source, target]);

    if (!links.has(linkKey)) {
      links.set(linkKey, { source, target, uuid: crypto.randomUUID() });
    }
  }
}

/**
 * Converts an analyzed URL and its skills into the shared graph tree shape.
 *
 * @param analyzeResponse - The URL analysis used to build the graph.
 * @returns A tree with prerequisite-to-URL and URL-to-objective links.
 */
export function createAnalyzeResponseTree(
  analyzeResponse: AnalyzeResponse,
): Tree {
  validateSkillGroups(analyzeResponse);

  const urlId = crypto.randomUUID();
  const nodes = new Map<string, WBNode>([
    [
      urlId,
      {
        name: analyzeResponse.url,
        type: "url",
        uuid: urlId,
      },
    ],
  ]);
  const links = new Map<string, Link>();

  addAnalyzedSkillsToTree(
    analyzeResponse.prerequisites,
    "prerequisite",
    urlId,
    nodes,
    links,
  );
  addAnalyzedSkillsToTree(
    analyzeResponse.objectives,
    "objective",
    urlId,
    nodes,
    links,
  );

  return {
    links: [...links.values()],
    nodes: [...nodes.values()],
  };
}
