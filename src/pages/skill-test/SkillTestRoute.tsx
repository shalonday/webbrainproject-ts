import type { ReactNode } from "react";
import { useParams } from "react-router-dom";

import { getSkillTestConfig } from "./registry";
import { SkillTestDynamicPage } from "./SkillTestDynamicPage";
import { SkillTestExternalRedirect } from "./SkillTestExternalRedirect";
import { SkillTestNotConfigured } from "./SkillTestNotConfigured";

/**
 * Route component for `/skill-test/:nodeId`.
 * Resolves the skill test configuration and renders the appropriate mode.
 *
 * @returns The rendered skill test experience for the given node ID.
 */
export function SkillTestRoute(): ReactNode {
  const { nodeId } = useParams<{ nodeId: string }>();
  const config = getSkillTestConfig(nodeId);

  if (!config) {
    return <SkillTestNotConfigured nodeId={nodeId ?? "unknown"} />;
  }

  switch (config.mode) {
    case "externalRedirect":
      return (
        <SkillTestExternalRedirect
          title={config.title}
          externalUrl={config.externalUrl}
        />
      );
    case "internalDynamic":
      return <SkillTestDynamicPage config={config} />;
    default:
      return <SkillTestNotConfigured nodeId={nodeId ?? "unknown"} />;
  }
}
