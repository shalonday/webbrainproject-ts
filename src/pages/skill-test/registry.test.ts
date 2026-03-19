import { describe, expect, it } from "vitest";

import { getSkillTestConfig, isAllowedExternalUrl } from "./registry";

describe("skill-test registry", () => {
  it("returns expected config for a known node ID", () => {
    const config = getSkillTestConfig("cbd84b0c-35ca-407b-80eb-aaa04f327565");

    expect(config).not.toBeNull();
    expect(config?.mode).toBe("externalRedirect");
    expect(config?.nodeId).toBe("cbd84b0c-35ca-407b-80eb-aaa04f327565");
  });

  it("returns null for unknown node ID", () => {
    const config = getSkillTestConfig("00000000-0000-0000-0000-000000000000");

    expect(config).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getSkillTestConfig(undefined)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(getSkillTestConfig("")).toBeNull();
  });
});

describe("isAllowedExternalUrl", () => {
  it("accepts valid https URLs", () => {
    expect(isAllowedExternalUrl("https://www.khanacademy.org/")).toBe(true);
  });

  it("rejects non-https or malformed URLs", () => {
    expect(isAllowedExternalUrl("http://www.khanacademy.org/")).toBe(false);
    expect(isAllowedExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedExternalUrl("not-a-valid-url")).toBe(false);
  });
});
