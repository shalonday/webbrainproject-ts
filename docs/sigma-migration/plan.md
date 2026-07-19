# Sigma Migration Execution Plan

## Goal

Replace the D3-based graph renderer with a Sigma.js renderer while preserving Phase 1 parity behavior defined in [docs/sigma-migration/parity-spec.md](../sigma-migration/parity-spec.md).

This plan is written so an LLM coding agent can execute it incrementally with clear file targets, acceptance criteria, and validation commands.

## Scope

In scope for PoC v1:

1. Directed graph rendering parity.
2. State-based styling parity for selected/path/done/study/current states.
3. Mouse parity: pan, zoom, node click callback.
4. Camera follow parity with initial focus behavior.
5. Touch parity: pinch zoom, two-finger pan, single-tap node click, touch start/end callbacks.
6. Test observability parity via renderer-neutral adapter where needed.

Out of scope for PoC v1:

1. Node drag-to-reposition parity (explicitly deferred to v2).

## Source of Truth

1. [docs/sigma-migration/parity-spec.md](../sigma-migration/parity-spec.md)
2. [src/pages/search/graph-styles.ts](../../src/pages/search/graph-styles.ts)
3. [src/pages/search/SearchPageChart.tsx](../../src/pages/search/SearchPageChart.tsx)
4. [src/pages/search/D3Chart.tsx](../../src/pages/search/D3Chart.tsx)
5. [src/pages/search/D3Chart.test.tsx](../../src/pages/search/D3Chart.test.tsx)
6. [src/test/search/SearchGraphDisplay.test.tsx](../../src/test/search/SearchGraphDisplay.test.tsx)
7. [src/test/search/GeneratePathButton.test.tsx](../../src/test/search/GeneratePathButton.test.tsx)
8. [src/test/search/LearningPathDisplay.test.tsx](../../src/test/search/LearningPathDisplay.test.tsx)
9. [src/test/search/PathTraversal.test.tsx](../../src/test/search/PathTraversal.test.tsx)
10. [src/test/search/SearchInput.test.tsx](../../src/test/search/SearchInput.test.tsx)
11. [src/test/search/SearchTextResults.test.tsx](../../src/test/search/SearchTextResults.test.tsx)
12. [src/test/search/Router.test.tsx](../../src/test/search/Router.test.tsx)
13. [src/test/search/searchTestUtils.ts](../../src/test/search/searchTestUtils.ts)
14. [src/common-constants.ts](../../src/common-constants.ts)

## Implementation Strategy

Use an incremental capability rollout with a temporary dual-renderer period:

1. Keep D3 renderer in place while Sigma renderer is built and validated.
2. Add a renderer boundary component so Search page orchestration does not depend on D3 internals.
3. Migrate tests to renderer-neutral assertions before deleting D3.
4. Remove D3 only after parity checklist is green.

## Phase 0: Preflight and Baseline Lock

### Objective

Create a reproducible baseline and lock parity targets before code changes.

### Tasks

1. Confirm branch and clean status.
2. Run baseline checks and record output summary:
   1. `npm run test:run`
   2. `npm run lint`
   3. `npm run build`
3. Copy or summarize parity requirements from [docs/sigma-migration/parity-spec.md](../sigma-migration/parity-spec.md) into implementation notes in this file.
4. Create a migration tracking checklist in PR description using the Acceptance Checklist section below.

### Deliverables

1. Green baseline command results or explicit list of known pre-existing failures.
2. Confirmed parity checklist to track pass/fail during implementation.

### Exit Criteria

1. Team agrees this spec is the only parity contract for PoC v1.

### Phase 0 Completion Snapshot (2026-06-28)

1. Branch: `sigma-migration`.
2. Working tree at check time: `?? docs/sigma-migration/`.
3. Baseline command results:
   1. `npm run test:run`: pass (22 files, 212 tests).
   2. `npm run lint`: pass with 8 pre-existing warnings and 0 errors.
   3. `npm run build`: pass (bundle-size warning only).

### Phase 0 Implementation Notes (from parity spec)

1. Renderer input contract must preserve these props and meanings:
   1. `tree`, `selectedNodeIds`, `pathTree`, `doneNodeIds`, `doneLinkIds`.
   2. `doneNodeTimestamps`, `markedForStudyNodeIds`, `currentNode`, `onNodeClick`.
2. Selection semantics are owned by SearchPageChart and must remain unchanged:
   1. If path exists, selected IDs come from path nodes only.
   2. Otherwise selected IDs are union(clicked IDs, highlighted IDs).
3. Styling priority must remain strict:
   1. Node fill priority: done > selected > marked-for-study > inactive.
   2. Link color priority: done > in-path > inactive.
   3. Path dimming opacity rules must stay unchanged.
4. Required PoC v1 interactions:
   1. Directed links + pan/zoom + click callback behavior.
   2. Camera-follow parity with `initialFocusNodeId`, LERP=0.18, threshold=0.5.
   3. Touch parity: pinch zoom, two-finger pan, tap-to-select, touch start/end callbacks.
5. Not required in PoC v1: node drag parity (deferred to v2).

### PR Checklist Template (Phase Tracking)

1. [ ] Baseline checks rerun for this PR (`test:run`, `lint`, `build`).
2. [ ] Renderer input contract unchanged vs parity spec.
3. [ ] Selection semantics unchanged (path-overrides-highlight).
4. [ ] Node/link styling priorities preserved.
5. [ ] Required interaction parity items validated for phase scope.
6. [ ] Test observability preserved or adapter added.
7. [ ] Acceptance checklist items touched by this PR are explicitly verified.

## Phase 1: Renderer Boundary and Data Contract

### Objective

Define a renderer-agnostic integration boundary so Sigma can be swapped in without changing search orchestration semantics.

### Files

1. [src/pages/search/SearchPageChart.tsx](../../src/pages/search/SearchPageChart.tsx)
2. New: [src/pages/search/GraphRenderer.tsx](../../src/pages/search/GraphRenderer.tsx)
3. New: [src/pages/search/graph-renderer-types.ts](../../src/pages/search/graph-renderer-types.ts)

### Tasks

1. Extract the effective renderer props contract from D3 usage:
   1. tree
   2. selectedNodeIds
   3. pathTree
   4. doneNodeIds, doneLinkIds
   5. doneNodeTimestamps
   6. markedForStudyNodeIds
   7. currentNode
   8. onNodeClick
   9. initialFocusNodeId
   10. onNodeTouchStart/onNodeTouchEnd
2. Create `graph-renderer-types.ts` with strict exported TypeScript interfaces and JSDoc.
3. Create `GraphRenderer.tsx` that temporarily delegates to D3 renderer by default.
4. Update `SearchPageChart.tsx` to render `GraphRenderer` instead of `D3Chart` directly.
5. Keep behavior unchanged.

### Deliverables

1. Renderer boundary exists with no behavior regression.
2. Search page still uses D3 through the boundary.

### Validation

1. `npm run test:run`
2. Manual smoke: Search page loads and graph interaction still works.

### Exit Criteria

1. No direct D3 dependency remains in `SearchPageChart`.

## Phase 2: Sigma Foundation (Dependencies + Graph Adapter)

### Objective

Introduce Sigma stack and a deterministic data adapter from WB tree to Graphology graph.
Use a deterministic UMAP projection for node coordinates and require embeddings on every node.

### Files

1. [package.json](../../package.json)
2. New: [src/pages/search/sigma/createSigmaGraph.ts](../../src/pages/search/sigma/createSigmaGraph.ts)
3. New: [src/pages/search/sigma/sigma-attributes.ts](../../src/pages/search/sigma/sigma-attributes.ts)

### Tasks

1. Add dependencies:
   1. `sigma`
   2. `graphology`
2. Keep D3 dependencies for now.
3. Implement `createSigmaGraph.ts`:
   1. Convert `tree.nodes` and `tree.links` into Graphology entities.
   2. Preserve stable IDs: node `uuid`, edge `uuid`.
   3. Attach attributes required for style/state updates.
4. Implement `sigma-attributes.ts` helper functions to map semantic state to Sigma visual attributes.
   1. Reserve Sigma `type` for renderer program keys only (for example `"circle"`).
   2. Store WB domain node type in a separate `wbType` attribute (for example `"skill" | "url"`).
   3. Update adapter/tests to read WB semantics from `wbType` to avoid `type` collisions.
5. Update the Sigma layout helper to project `embedding` vectors through deterministic UMAP.
6. Fail fast if any node is missing an embedding so incomplete graph data is surfaced early.
7. Ensure adapter does not alter selection/path semantics; it only maps data.

### Deliverables

1. Repeatable graph adapter producing stable graph structure.
2. Attribute helpers ready for style parity.
3. Deterministic embedding-based coordinates with strict embedding validation.

### Validation

1. Add unit tests for adapter determinism and ID mapping.
2. Add/maintain unit tests verifying Sigma `type` vs WB `wbType` attribute separation.
3. Add unit tests covering deterministic UMAP projection and embedding validation failures.
4. `npm run test:run`

### Exit Criteria

1. WB tree converts to Sigma graph with deterministic node/edge identity and attributes.
2. Sigma program attributes and WB semantic attributes are unambiguous (`type` vs `wbType`).
3. Node coordinates use deterministic UMAP and fail fast when embeddings are missing.

## Phase 3: Sigma Renderer Core (Visual Parity)

### Objective

Build Sigma renderer with parity for node/link styling and directed edge clarity.

### Files

1. New: [src/pages/search/SigmaChart.tsx](../../src/pages/search/SigmaChart.tsx)
2. [src/pages/search/GraphRenderer.tsx](../../src/pages/search/GraphRenderer.tsx)
3. [src/pages/search/graph-styles.ts](../../src/pages/search/graph-styles.ts) (reuse, minimal changes only)

### Tasks

1. Implement `SigmaChart.tsx` with the same external prop contract as D3 chart.
2. Use `graph-styles.ts` as semantic source for:
   1. Node fill priority: done > selected > study > inactive.
   2. Node opacity with path dimming rules.
   3. Link color priority: done > in-path > inactive.
   4. Link opacity with path dimming rules.
3. Ensure directed edges are visually clear in Sigma rendering.
4. Expose observability markers for tests through a renderer-neutral test adapter if direct DOM attributes are unavailable.
5. Wire `GraphRenderer.tsx` so implementation can switch D3 vs Sigma through a local constant or feature flag.

### Deliverables

1. Sigma chart renders same graph and state styles as D3 baseline.
2. Boundary component can select renderer implementation.

### Validation

1. Manual comparison between D3 and Sigma for same input state.
2. `npm run test:run`
3. `npm run lint`

### Exit Criteria

1. Visual parity achieved for static state rendering and updates.

## Phase 4: Interaction Parity (Mouse + Camera + Touch)

### Objective

Implement required interaction parity from spec.

### Files

1. [src/pages/search/SigmaChart.tsx](../../src/pages/search/SigmaChart.tsx)
2. Optional new helper: [src/pages/search/sigma/cameraFollow.ts](../../src/pages/search/sigma/cameraFollow.ts)
3. Optional new helper: [src/pages/search/sigma/touchHandlers.ts](../../src/pages/search/sigma/touchHandlers.ts)

### Tasks

1. Node click parity:
   1. Map Sigma node click event to `onNodeClick(nodeId)`.
2. Camera follow parity:
   1. Support `initialFocusNodeId`.
   2. Seed focus position near baseline target equivalent (400x400 view, focus around x=200, y=100 semantics).
   3. Implement LERP camera follow while layout settles.
   4. Use baseline constants: LERP 0.18, settle threshold 0.5 px.
   5. Preserve zoom while camera translates.

### Deliverables

1. Required interaction parity implemented for PoC v1.

### Validation

1. Add/adjust tests for click callback and camera follow trigger behavior.
2. Manual mobile/touch QA in browser device emulation and at least one real touch device if available.
3. `npm run test:run`

### Exit Criteria

1. All required interaction items in parity spec pass.

## Phase 5: Tooltip and Observability Parity

### Objective

Preserve metadata visibility and test stability across renderer internals.

### Files

1. [src/pages/search/SigmaChart.tsx](../../src/pages/search/SigmaChart.tsx)
2. New (if needed): [src/test/search/graphTestAdapter.ts](../../src/test/search/graphTestAdapter.ts)
3. [src/pages/search/D3Chart.test.tsx](../../src/pages/search/D3Chart.test.tsx)
4. [src/test/search/SearchGraphDisplay.test.tsx](../../src/test/search/SearchGraphDisplay.test.tsx)
5. [src/test/search/GeneratePathButton.test.tsx](../../src/test/search/GeneratePathButton.test.tsx)
6. [src/test/search/LearningPathDisplay.test.tsx](../../src/test/search/LearningPathDisplay.test.tsx)
7. [src/test/search/PathTraversal.test.tsx](../../src/test/search/PathTraversal.test.tsx)
8. [src/test/search/SearchInput.test.tsx](../../src/test/search/SearchInput.test.tsx)
9. [src/test/search/SearchTextResults.test.tsx](../../src/test/search/SearchTextResults.test.tsx)
10. [src/test/search/Router.test.tsx](../../src/test/search/Router.test.tsx)
11. [src/test/search/searchTestUtils.ts](../../src/test/search/searchTestUtils.ts)

### Tasks

1. Implement tooltip parity for:
   1. Node type label.
   2. Done timestamp when available.
2. If Sigma cannot expose identical DOM attributes, provide a test adapter that exposes equivalent semantics for:
   1. Current node distinguishability.
   2. Done/study distinguishability.
   3. Node interaction hooks.
3. Migrate tests to avoid hard-coding SVG-only assumptions.
4. Preserve parity for the full `src/test/search` folder, including:
   1. Graph display and node styling assertions.
   2. Search input focus, keyboard submission, and no-refetch behavior.
   3. Search text result rendering and selection cues.
   4. Generate Path enablement, path request issuance, and graph highlight updates.
   5. Learning Path display, ordering, clickability, and dimming behavior.
   6. Path traversal, Move Forward behavior, current/done state updates, and skill-test routing.
   7. Router behavior for root, `/paths/:startId/:endId`, and `/skill-test/:nodeId` routes.
5. Keep parity checks behavior-oriented.

### Deliverables

1. Stable test observability independent of SVG internals.
2. Updated tests passing against Sigma renderer.

### Validation

1. `npm run test:run -- src/test/search`
2. `npm run test:run`
3. Verify checklist item coverage in test names or comments for the full search test folder.

### Exit Criteria

1. Graph and search-flow tests validate parity semantics, not renderer-specific DOM structure.

## Phase 6: Cutover, Cleanup, and Documentation

### Objective

Switch default renderer to Sigma, remove D3, and finalize docs.

### Files

1. [src/pages/search/GraphRenderer.tsx](../../src/pages/search/GraphRenderer.tsx)
2. [src/pages/search/D3Chart.tsx](../../src/pages/search/D3Chart.tsx) (remove or archive)
3. [src/pages/search/D3Chart.test.tsx](../../src/pages/search/D3Chart.test.tsx) (replace/remove as appropriate)
4. [package.json](../../package.json)
5. [docs/architecture.md](../architecture.md)
6. [docs/sigma-migration/plan.md](./plan.md)

### Tasks

1. Flip GraphRenderer default to Sigma implementation.
2. Remove D3 dependencies from package.json:
   1. `d3`
   2. `@types/d3`
3. Remove dead D3-specific code and tests.
4. Update architecture doc to describe Sigma renderer ownership and data flow.
5. Record final migration status and known gaps (only v2 items, if any).

### Deliverables

1. Sigma is the only production renderer.
2. D3 dependencies removed.
3. Documentation updated.

### Validation

1. `npm run lint`
2. `npm run test:run`
3. `npm run build`
4. Manual parity sweep against acceptance checklist.

### Exit Criteria

1. All PoC v1 parity items pass.
2. No D3 runtime dependency remains.

## Acceptance Checklist (Must Pass Before Merge)

1. Search keyword "javascript" highlights matching nodes with active fills when no path is active.
2. Clicking a skill node shows skill active fill.
3. Clicking a URL node shows URL active fill.
4. Active path dims out-of-path nodes/links with correct opacities.
5. Done nodes use done fills and preserve done/study coexistence rules.
6. Done links use done link color.
7. No highlight regressions after search, path generation, or move-forward transitions.
8. Camera follow works with initial focus node and preserves zoom.
9. Touch parity behaviors work: pinch zoom, two-finger pan, tap-to-select, touch callbacks.

## Suggested PR Breakdown

1. PR 1: Renderer boundary + types (Phase 1).
2. PR 2: Sigma dependencies + adapter + Sigma shell (Phase 2-3 partial).
3. PR 3: Interaction parity (camera + touch) (Phase 4).
4. PR 4: Test migration and observability adapter (Phase 5).
5. PR 5: Cutover and D3 removal + docs updates (Phase 6).

## LLM Execution Protocol

For each phase, the implementing agent should:

1. Read this plan and [docs/sigma-migration/parity-spec.md](../sigma-migration/parity-spec.md).
2. Make only phase-scoped changes.
3. Run validation commands listed for that phase.
4. Report:
   1. Files changed.
   2. Checklist items verified.
   3. Remaining risks.
5. Stop after phase completion and request approval before starting next phase.

## Known Risks and Mitigations

1. Canvas/WebGL observability may differ from SVG attributes.
   1. Mitigation: test adapter abstraction and behavior-centric assertions.
2. Touch event behavior can vary across browsers.
   1. Mitigation: explicit pointer/touch handling helpers and manual QA matrix.
3. Camera follow may feel different even if technically centered.
   1. Mitigation: enforce baseline constants and compare visually against D3 behavior.
4. Performance changes from layout/renderer differences.
   1. Mitigation: test large trees and ensure responsive interactions before cutover.
