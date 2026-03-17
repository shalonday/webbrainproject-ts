/** Supported skill test execution modes. */
export type SkillTestMode = "externalRedirect" | "internalDynamic";

/** Common fields shared by all skill test configurations. */
export interface SkillTestConfigBase {
  nodeId: string;
  title: string;
  mode: SkillTestMode;
}

/** Configuration for a skill test that redirects to an external URL. */
export interface ExternalRedirectSkillTestConfig extends SkillTestConfigBase {
  mode: "externalRedirect";
  externalUrl: string;
}

/** Configuration for a skill test rendered as an internal WBP page. */
export interface InternalDynamicSkillTestConfig extends SkillTestConfigBase {
  mode: "internalDynamic";
  dynamicTemplateId: string;
  metadata?: {
    estimatedMinutes?: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
  };
}

/** Union of all skill test configuration variants. */
export type SkillTestConfig =
  | ExternalRedirectSkillTestConfig
  | InternalDynamicSkillTestConfig;
