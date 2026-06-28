# Graph Renderer PoC Plan (Sigma.js vs Reagraph)

## Goal

Compare Sigma.js and Reagraph as replacements for the current D3 graph renderer in Search, then recommend one based on:

1. Stress-scale performance.
2. UX parity with current behavior.
3. No regression in search and path highlighting behavior.

## Scope

In scope (PoC v1):

1. Render nodes and directed links.
2. Pan and zoom.
3. Click selection.
4. Highlight parity for selected, search-related, path-related, done, and marked-for-study states.
5. Stress-only benchmark run.

Out of scope (v2 backlog):

1. Node drag parity.
2. Camera follow animation parity.
3. Touch interaction parity.
4. Full production cutover from D3.

## Success Criteria

A renderer is a migration candidate only if all are true:

1. Correct state highlighting for nodes and links under Search interactions.
2. No functional regression in click selection and zoom/pan.
3. Acceptable responsiveness under stress dataset relative to baseline D3.
4. Implementation complexity is maintainable for the team.

Hard blockers:

1. Incorrect search or path highlights.
2. Broken selection behavior.
3. Severe interaction lag or instability under stress dataset.

## Constraints and Existing Anchors

Primary integration and behavior anchors:

1. src/pages/search/D3Chart.tsx
2. src/pages/search/SearchPageChart.tsx
3. src/pages/search/Search.tsx
4. src/pages/search/graph-styles.ts
5. src/pages/search/D3Chart.test.tsx
6. src/test/search/SearchGraphDisplay.test.tsx
7. src/test/search/searchTestUtils.ts
8. src/common-constants.ts
9. docs/architecture.md

Do not break existing Search page flow or data shape.

## Execution Phases

### Phase 0: Setup and Guardrails

Objective: Create a safe, reversible evaluation path.

Tasks:

1. Work on branch graph-performance (already created).
2. Add a feature flag for renderer selection (single source of truth).
3. Keep D3 as default until final recommendation.
4. Confirm baseline test/lint/build all pass before modifications.

Suggested command sequence:

1. npm ci
2. npm run lint
3. npm run test:run
4. npm run build

Deliverables:

1. Baseline results recorded in docs/graph-performance/baseline.md.
2. Renderer flag strategy documented in docs/graph-performance/experiment-config.md.

Exit criteria:

1. Baseline checks are green.
2. Feature flag plan is documented.

---

### Phase 1: Baseline Behavior Capture (Current D3)

Objective: Lock current behavior as parity target.

Tasks:

1. Capture expected visual state mapping from graph-styles:
   1. Node fill precedence.
   2. Node opacity rules.
   3. Link color and opacity rules.
2. Capture Search interaction behavior:
   1. Click selection toggling.
   2. Search result highlighting.
   3. Path highlighting behavior.
3. Define stress benchmark graph profile:
   1. Node count target.
   2. Edge count target.
   3. Density assumptions.

Additional parity requirements added (camera follow & touch):

1. Camera follow: PoC renderers must implement `initialFocusNodeId` seeding and camera-follow LERP behavior matching the D3 baseline (see parity-spec.md for exact constants: `CAMERA_FOLLOW_LERP = 0.18`, `CAMERA_SETTLE_THRESHOLD = 0.5`).
2. Touch interactions: PoC renderers must support single-finger tap (node selection), two-finger pan, and pinch-to-zoom mapped to the same zoom scale (0.5–4). The renderer should forward `onNodeTouchStart` and `onNodeTouchEnd` callbacks.

Deliverables:

1. docs/graph-performance/parity-spec.md

Exit criteria:

1. Parity spec approved and unambiguous.
2. Stress dataset source and profile fixed for all renderer runs (Neo4j snapshot or equivalent).

---

### Phase 2: Renderer Abstraction Seam

Objective: Add a narrow swap point without changing Search business logic.

Tasks:

1. Introduce a renderer contract type in Search graph area (props and callbacks required for PoC v1).
2. Keep existing graph style helpers as the single visual-state source.
3. Wire SearchPageChart to choose renderer by feature flag.
4. Keep D3 implementation behind same contract.

Implementation guidance:

1. Avoid broad refactors.
2. Do not move business logic from Search/SearchPageChart into renderer-specific files.
3. Prefer one composition seam over many conditionals.

Deliverables:

1. Contract definition file (for renderer props shape).
2. SearchPageChart using feature-flagged renderer selection.

Exit criteria:

1. App behavior unchanged with D3 selected.
2. Existing Search tests still pass.

---

### Phase 3: Sigma.js PoC Implementation

Objective: Implement Sigma renderer with PoC v1 feature parity.

Tasks:

1. Add Sigma.js dependencies.
2. Create Sigma renderer component in src/pages/search.
3. Map universal tree data into Sigma graph format.
4. Implement:
   1. Node and link rendering.
   2. Zoom/pan.
   3. Click selection callback.
   4. Highlight mapping using existing style outputs.
5. Ensure updates react to state changes without full teardown when possible.

Testing tasks:

1. Add Sigma-focused renderer tests.
2. Run Search integration tests with Sigma flag on.
3. Verify stress run interactions manually.

Deliverables:

1. Sigma renderer component.
2. Sigma test file(s).
3. docs/graph-performance/sigma-results.md

Exit criteria:

1. Functional parity for in-scope interactions.
2. Stress benchmark notes recorded.
3. No blocker regressions in highlight behavior.

---

### Phase 4: Reagraph PoC Implementation

Objective: Implement Reagraph renderer under same contract.

Tasks:

1. Add Reagraph dependencies.
2. Create Reagraph renderer component in src/pages/search.
3. Map universal tree data into Reagraph node/link model.
4. Implement:
   1. Node and link rendering.
   2. Zoom/pan.
   3. Click selection callback.
   4. Highlight mapping using same style logic.
5. Keep implementation comparable to Sigma to avoid skew.

Testing tasks:

1. Add Reagraph-focused renderer tests.
2. Run Search integration tests with Reagraph flag on.
3. Execute stress interaction script manually.

Deliverables:

1. Reagraph renderer component.
2. Reagraph test file(s).
3. docs/graph-performance/reagraph-results.md

Exit criteria:

1. Functional parity for in-scope interactions.
2. Stress benchmark notes recorded.
3. No blocker regressions in highlight behavior.

---

### Phase 5: Side-by-Side Benchmark and Scoring

Objective: Make comparison objective and repeatable.

Tasks:

1. Run identical interaction script on D3, Sigma, Reagraph:
   1. Initial render.
   2. Continuous pan/zoom.
   3. Multi-node click selection.
   4. Search query that highlights multiple nodes.
   5. Path activation and visibility checks.
2. Capture observations:
   1. Interaction smoothness and lag.
   2. Visual correctness of highlights.
   3. Stability issues (flicker, lost state, crashes).
3. Score each renderer using weighted rubric:
   1. 45% performance at stress scale.
   2. 35% UX parity.
   3. 20% implementation maintainability.

Deliverables:

1. docs/graph-performance/comparison-matrix.md
2. docs/graph-performance/raw-observations.md

Exit criteria:

1. All three renderers scored with same rubric.
2. Highlight regressions clearly classified as blocker or non-blocker.

---

### Phase 6: Recommendation and Migration Proposal

Objective: Choose a winner and define next steps.

Tasks:

1. Recommend renderer with strongest score and acceptable risk profile.
2. Record unresolved parity gaps and remediation estimates.
3. Define migration plan:
   1. v2 features (drag/touch/camera follow).
   2. rollout strategy.
   3. fallback strategy.
4. Update architecture docs.

Deliverables:

1. docs/graph-performance/recommendation.md
2. docs/architecture.md updates (if architecture decision is made)

Exit criteria:

1. Recommendation approved.
2. Follow-up implementation backlog created.

## LLM Execution Checklist

Use this checklist in order. Do not skip steps.

1. Read current graph files and tests listed in Constraints and Existing Anchors.
2. Run baseline lint/test/build and record outcomes.
3. Implement feature-flag seam with D3 unchanged as default.
4. Add Sigma renderer and validate parity + stress behavior.
5. Add Reagraph renderer and validate parity + stress behavior.
6. Produce side-by-side scoring docs.
7. Publish recommendation and migration backlog.

## Prompt Template for an Execution LLM

Use this prompt for each phase execution run:

You are implementing Phase X of the graph renderer PoC in webbrainproject-ts.

Requirements:

1. Keep changes minimal and scoped.
2. Preserve Search behavior and state flow.
3. Do not regress highlight logic from graph-styles.
4. Run lint/tests/build relevant to your changes.
5. Update the phase deliverable docs before finishing.

Output format:

1. Files changed.
2. Tests run and results.
3. Risks found.
4. Follow-up tasks.

## Risk Register (Initial)

1. WebGL/canvas test environment differences may reduce test reliability.
2. Library-specific layout behavior may alter user perception of graph quality.
3. Performance bottlenecks may come from state churn, not rendering library.
4. Highlight parity can silently regress if renderer caches stale node styles.

## Non-Negotiables

1. Search and path highlight correctness is mandatory.
2. Feature flag must allow quick fallback to D3.
3. Benchmark conditions must be identical for all renderers.
4. Recommendation must cite evidence from collected docs in this folder.
