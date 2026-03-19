# Phase 1 Implementation Plan: Skill Test Route

## Purpose

Implement Phase 1 from the rollout plan in `docs/specifications.md`.

This plan is intentionally execution-oriented so you can hand it to an AI and say "do this".

## Phase 1 Scope

Deliver all of the following:

- New route: `/skill-test/:nodeId`
- Frontend-owned registry keyed by skill node ID
- Two route modes:
  - external redirect
  - internal dynamic page
- Fallback page for unknown IDs
- Resolver and route/component tests
- No backend changes
- Keep manual Done flow in Search (no auto-sync to Search tab yet)

## Constraints and Guardrails

- Preserve existing Search behavior and existing `/paths/:startId/:endId` flow.
- Do not change `useLearningPathNavigator` route string format.
- External redirects must allow only `https:` URLs.
- Keep all new code TypeScript strict-compatible.
- Follow existing code style and lint rules.

## Implementation Steps

### Step 1: Create skill-test types

Create `src/pages/skill-test/types.ts` with:

- `SkillTestMode = "externalRedirect" | "internalDynamic"`
- `SkillTestConfigBase`
- `ExternalRedirectSkillTestConfig`
- `InternalDynamicSkillTestConfig`
- union `SkillTestConfig`

Exit criteria:

- Type file compiles with no TS errors.

### Step 2: Create registry and resolver utility

Create `src/pages/skill-test/registry.ts`.

Add:

- `SKILL_TEST_REGISTRY: Record<string, SkillTestConfig>`
- At least one real external redirect entry (use a known skill UUID from test data if available; you may use this: "uuid: "bd9e1985-b9b3-4395-8c59-9e632f9f4ef7"")
- At least one internal dynamic entry (you may use this: uuid: "3b16c249-0a8d-484c-ba14-90c611ccd077")

Add helper exports:

- `getSkillTestConfig(nodeId: string | undefined): SkillTestConfig | null`
  - returns `null` on missing/empty/not-found
- `isAllowedExternalUrl(url: string): boolean`
  - returns `true` only for valid `https:` URL

Exit criteria:

- Registry and helpers are importable and typed.
- URL validator rejects non-https values.

### Step 3: Build route components

Create the following components:

- `src/pages/skill-test/SkillTestExternalRedirect.tsx`
- `src/pages/skill-test/SkillTestDynamicPage.tsx`
- `src/pages/skill-test/SkillTestNotConfigured.tsx`
- `src/pages/skill-test/SkillTestRoute.tsx`

#### 3A) `SkillTestExternalRedirect.tsx`

Responsibilities:

- Accept `title` and `externalUrl` props.
- Show transition UI text: "Redirecting you to practice..."
- Render a button with explicit link action: "Open practice link"
- On mount, if `externalUrl` is valid via `isAllowedExternalUrl`, call `window.location.assign(externalUrl)`
- If invalid URL, render safe error state and do not redirect

Implementation notes:

- Use `useEffect` for auto-redirect.
- Keep redirect side effect idempotent enough for test environments.

#### 3B) `SkillTestDynamicPage.tsx`

Responsibilities:

- Accept config object for internal mode.
- Render minimal dynamic page:
  - title
  - short instructions
  - one interactive element (checkbox or simple self-check control)
  - completion button labeled "Done"
  - optional "Back to Search" link/button to `/`
- No cross-tab sync in Phase 1.

#### 3C) `SkillTestNotConfigured.tsx`

Responsibilities:

- Friendly fallback UI.
- Explain skill test is not configured yet.
- Display `nodeId` for debugging.
- Include navigation back to `/`.

#### 3D) `SkillTestRoute.tsx`

Responsibilities:

- Read `nodeId` from route params.
- Resolve config via `getSkillTestConfig`.
- Branch behavior:
  - no config -> `SkillTestNotConfigured`
  - `externalRedirect` -> `SkillTestExternalRedirect`
  - `internalDynamic` -> `SkillTestDynamicPage`
  - unknown mode (type safety fallback) -> `SkillTestNotConfigured`

Exit criteria:

- Navigating to known IDs renders the expected mode.
- Unknown ID renders fallback.

### Step 4: Wire route into app router

Edit `src/App.tsx`:

- Import `SkillTestRoute`.
- Add route: `<Route path="/skill-test/:nodeId" element={<SkillTestRoute />} />`

Do not remove existing routes:

- `/`
- `/paths/:startId/:endId`

Exit criteria:

- Existing Search routes still render.
- Skill-test route resolves.

### Step 5: Add test coverage

Create test files:

- `src/pages/skill-test/registry.test.ts`
- `src/pages/skill-test/SkillTestRoute.test.tsx`

Update existing router integration test:

- `src/test/search/Router.test.tsx`

#### 5A) `registry.test.ts`

Test cases:

- `getSkillTestConfig` returns expected config for known ID.
- `getSkillTestConfig` returns `null` for unknown ID.
- `getSkillTestConfig` returns `null` for undefined/empty input.
- `isAllowedExternalUrl` accepts valid `https://...`.
- `isAllowedExternalUrl` rejects `http://...`, `javascript:...`, malformed URLs.

#### 5B) `SkillTestRoute.test.tsx`

Use `MemoryRouter` and route entries.

Test cases:

- Known external ID renders redirect UI and CTA button.
- Known internal ID renders dynamic page UI and Done button.
- Unknown ID renders not-configured UI with node ID shown.

Mocking detail:

 - Stub or mock `location.assign` (we used `vi.stubGlobal("location", { ...window.location, assign: mock })`) to assert redirects without performing a real navigation.
 - Note: the CTA may render as a `link` role (MUI `Button` used with `component={Link}`); query it with `getByRole('link', { name: /open practice link/i })` in tests.

#### 5C) Update `Router.test.tsx`

Add route registration in the local test router and a new test:

- route `/skill-test/:nodeId` mounts and renders expected content.

Exit criteria:

- New tests pass.
- Existing traversal tests still pass.

### Step 6: Verify locally

Run in order:

1. `npm run lint`
2. `npm run test:run`
3. `npm run build`

If failures occur:

- Fix only issues related to this feature.
- Do not refactor unrelated modules.

Exit criteria:

- All three commands pass.

### Step 7: Update architecture doc

Edit `docs/architecture.md` to include the new skill-test module and route flow.

Add concise notes for:

- New route ownership
- Registry-driven mode resolution
- Fallback behavior

Exit criteria:

- Architecture doc reflects new file structure and route behavior.

## Suggested File Creation and Edit Checklist

Create:

- `src/pages/skill-test/types.ts`
- `src/pages/skill-test/registry.ts`
- `src/pages/skill-test/SkillTestExternalRedirect.tsx`
- `src/pages/skill-test/SkillTestDynamicPage.tsx`
- `src/pages/skill-test/SkillTestNotConfigured.tsx`
- `src/pages/skill-test/SkillTestRoute.tsx`
- `src/pages/skill-test/registry.test.ts`
- `src/pages/skill-test/SkillTestRoute.test.tsx`

Edit:

- `src/App.tsx`
- `src/test/search/Router.test.tsx`
- `docs/architecture.md`

## Definition of Done

Phase 1 is done when all are true:

- `/skill-test/:nodeId` route works.
- Registry controls behavior by node ID.
- External redirect mode works with https validation.
- Internal dynamic mode renders and supports manual Done flow.
- Unknown node IDs fail gracefully.
- Tests added and passing.
- Lint and build pass.
- Architecture doc updated.

## Out of Scope for This Implementation

- Backend endpoint for skill-test configuration.
- Database table for mapping node IDs.
- Search tab auto-update from skill-test completion.
- User progress persistence for dynamic tests.

## AI Execution Prompt (copy/paste)

Implement Phase 1 from docs/implementation.md exactly as written.

Requirements:

- Create all listed files and apply all listed edits.
- Keep existing Search behavior unchanged.
- Add route /skill-test/:nodeId using registry-based resolution.
- Support externalRedirect and internalDynamic modes.
- Include fallback page for unknown node IDs.
- Add/adjust tests exactly as specified.
- Run lint, tests, and build; fix feature-related failures.
- Update docs/architecture.md for the new module.
- Provide a summary of changed files and test/build results.
