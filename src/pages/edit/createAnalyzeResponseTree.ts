import type {
  AnalyzedSkill,
  AnalyzeResponse,
  Link,
  Tree,
  WBNode,
} from "../../types/types";

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
    // use a non-uuid string for new candidate skills; preexisting skills obtained from DB are true uuids that don't start with "candidate-skill"
    const skillId =
      skill.uuid ?? `candidate-skill:${encodeURIComponent(skill.name)}`;
    if (!nodes.has(skillId)) {
      nodes.set(skillId, {
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

  console.log("createAnalyzeResponseTree nodes:", nodes);
  console.log("createAnalyzeResponseTree links:", links);

  return {
    links: [...links.values()],
    nodes: [...nodes.values()],
  };
}
