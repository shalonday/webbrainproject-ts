# Skill Test Route Specification

## Summary

Add a new route at `/skill-test/:nodeId` that resolves the skill test experience for a specific skill node.

The route must support two execution modes:

- External redirect mode: forward learner to a third-party skill practice URL (example: Khan Academy exercise).
- Internal dynamic mode: render a Web Brain Project page generated from local/frontend logic (and optionally backend data later).

This specification proposes a phased implementation that is compatible with the current path traversal flow in Search.

## Problem Statement

The Search learning path flow currently opens `/skill-test/${node.uuid}` in a new tab for skill nodes. There is no route implemented for that URL yet.

Without a route, users cannot receive skill-specific behavior, and future skill-check customization by node ID is blocked.

## Goals

- Provide a working route for `/skill-test/:nodeId`.
- Support per-skill behavior determined by node ID.
- Allow both external redirects and internal skill test pages.
- Keep behavior deterministic and testable.
- Keep current Search flow intact, including opening in a new tab.

## Non-goals (for this phase)

- Full adaptive testing engine.
- User accounts or cloud persistence.
- Authoring UI for skill test content.
- Internationalization.

## User Stories

- As a learner, when I land on a skill node and click through the flow, a skill-test page opens for that exact skill.
- As a learner, some skills send me directly to a trusted external practice page.
- As a learner, other skills show an internal WBP skill test page tailored to that skill.
- As a developer, I can configure skill test behavior by node ID in one place.

## Route Contract

Path:

- `/skill-test/:nodeId`

Params:

- `nodeId` (required, string UUID)

Behavior:

- If node ID has a configured external redirect: show a small transition screen and redirect to external URL.
- If node ID has a configured internal renderer: render internal page.
- If node ID is unknown: render a not-configured page with guidance and link back to Search.

## Recommended Architecture

### 1) Introduce a skill-test feature module

Suggested file structure:

- `src/pages/skill-test/SkillTestRoute.tsx`
- `src/pages/skill-test/SkillTestExternalRedirect.tsx`
- `src/pages/skill-test/SkillTestDynamicPage.tsx`
- `src/pages/skill-test/SkillTestNotConfigured.tsx`
- `src/pages/skill-test/registry.ts`
- `src/pages/skill-test/types.ts`

### 2) Add route in App

Current router has Search routes only. Add:

- `path="/skill-test/:nodeId" element={<SkillTestRoute />}`

No change required in `useLearningPathNavigator` path format because it already opens `/skill-test/${node.uuid}`.

### 3) Use a registry keyed by node ID

Define a strongly typed registry mapping skill node ID to behavior.

Example shape:

- `mode`: `externalRedirect | internalDynamic`
- `title`: display name
- `externalUrl` (required for externalRedirect)
- `dynamicTemplateId` or generator config (required for internalDynamic)
- optional metadata: difficulty, tags, estimatedMinutes

This keeps phase 1 simple and avoids backend dependency.

### 4) Route resolver behavior

`SkillTestRoute` resolves node ID in this order:

1. Validate param exists.
2. Lookup node config in registry.
3. If missing, render Not Configured state.
4. If `externalRedirect`, render redirect component.
5. If `internalDynamic`, render dynamic page component.

## External Redirect UX Requirements

Because the path flow opens a new tab programmatically, browsers may block popups depending on timing. Route UX should remain functional if redirect is delayed.

Requirements:

- Display message: "Redirecting you to practice..."
- Provide visible button: "Open practice link"
- Automatically redirect with `window.location.assign(externalUrl)` after render.
- Validate URL protocol is `https:`.
- If invalid URL, show safe error state instead of redirecting.

## Internal Dynamic Page Requirements

For this phase, dynamic means generated from local configuration and reusable components.

Minimum content:

- Skill title
- Short instructions
- At least one interactive section (question set, checklist, or mini challenge)
- Completion action (button)
- Optional "Back to Search" action

Data source options:

- Phase 1: local templates keyed by `dynamicTemplateId`.
- Phase 2: backend endpoint such as `GET /skill-tests/:nodeId` returning JSON schema.

## Proposed Types

```ts
export type SkillTestMode = "externalRedirect" | "internalDynamic";

export interface SkillTestConfigBase {
  nodeId: string;
  title: string;
  mode: SkillTestMode;
}

export interface ExternalRedirectSkillTestConfig extends SkillTestConfigBase {
  mode: "externalRedirect";
  externalUrl: string;
}

export interface InternalDynamicSkillTestConfig extends SkillTestConfigBase {
  mode: "internalDynamic";
  dynamicTemplateId: string;
  metadata?: {
    estimatedMinutes?: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
  };
}

export type SkillTestConfig =
  | ExternalRedirectSkillTestConfig
  | InternalDynamicSkillTestConfig;
```

## Example Registry Entries

```ts
export const SKILL_TEST_REGISTRY: Record<string, SkillTestConfig> = {
  "dc7161be-0000-8000-0000-018d39e8c7cd": {
    nodeId: "dc7161be-0000-8000-0000-018d39e8c7cd",
    title: "write JavaScript Functions",
    mode: "externalRedirect",
    externalUrl:
      "https://www.khanacademy.org/computing/computer-programming/programming",
  },
  "some-internal-skill-node-id": {
    nodeId: "some-internal-skill-node-id",
    title: "use JavaScript Closures",
    mode: "internalDynamic",
    dynamicTemplateId: "js-closures-v1",
    metadata: { estimatedMinutes: 10, difficulty: "intermediate" },
  },
};
```

## Error Handling and Fallbacks

Cases to handle:

- Missing `nodeId` param.
- Node ID not in registry.
- Invalid `externalUrl` value.
- Unsupported config mode.

Fallback page should include:

- Friendly message that this skill test is not configured yet.
- Link to return home (`/`).
- Display of node ID for debugging.

## Security and Validation

- Only allow `https:` external redirects.
- Never render raw HTML from config.
- Use strict TypeScript narrowing for config mode handling.
- Keep URL validation in a small utility with unit tests.

## Observability (Optional but recommended)

Emit simple analytics events:

- `skill_test_route_opened`
- `skill_test_external_redirected`
- `skill_test_internal_rendered`
- `skill_test_not_configured`

Include node ID and mode in payload.

## Test Plan

### Unit tests

- Registry resolver returns correct mode by node ID.
- URL validator accepts valid https URLs and rejects others.
- Unknown node ID resolves to not-configured path.

### Component tests

- `/skill-test/:nodeId` renders external transition and redirect CTA.
- `/skill-test/:nodeId` renders internal dynamic content for internal mode.
- Unknown node ID renders fallback UI.

### Router tests

Update router integration tests to include new route mounting and render behavior.

### Existing traversal tests

Keep current assertions that Search opens `/skill-test/...` for skill nodes.

## Rollout Plan

### Phase 1 (recommended now)

- Add route + local registry + two mode components + fallback.
- Add tests for resolver and route rendering.
- Configure a small starter list of skill node IDs.

### Phase 2

- Move registry source to backend endpoint while preserving frontend type contract.
- Add richer dynamic content templates.

### Phase 3

- Track completion outcomes and integrate with learner progress graph.

## Acceptance Criteria

- Navigating to `/skill-test/:nodeId` always renders a deterministic state.
- At least one skill ID configured for each mode.
- Unknown IDs fail gracefully with user guidance.
- All new tests pass (`npm run test:run`).
- Existing Search path traversal behavior remains intact.

## Open Questions

- Should external redirects happen immediately or require explicit click only?
  - immediately
- Should completion in internal dynamic mode automatically inform the Search tab state?
  - keep manual Done flow for now
- Should registry remain frontend-owned for MVP or be served by backend from day one?
  - fine with frontend-owned for MVP

## Implementation Recommendation

Start with frontend-owned registry and route resolver (Phase 1). It is the lowest-risk path, fast to ship, and gives you clear extension points for backend-driven dynamic pages later.
