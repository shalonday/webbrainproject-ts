# D3 Baseline Parity Spec (Phase 1)

## Purpose

Define exact behavior that Sigma.js and Reagraph must match in PoC v1.
This document is the parity contract for renderer replacement.

## Source of Truth

1. src/pages/search/graph-styles.ts
2. src/pages/search/SearchPageChart.tsx
3. src/pages/search/D3Chart.tsx
4. src/test/search/SearchGraphDisplay.test.tsx
5. src/test/search/LearningPathDisplay.test.tsx
6. src/pages/search/D3Chart.test.tsx
7. src/common-constants.ts

## Renderer-Agnostic Input Contract

The renderer must support this effective input model:

1. tree: universal graph to render.
2. selectedNodeIds: final highlight IDs from SearchPageChart.
3. pathTree: active path graph or null.
4. doneNodeIds, doneLinkIds.
5. doneNodeTimestamps.
6. markedForStudyNodeIds.
7. currentNode.
8. onNodeClick callback.

## State Resolution Rules

### Node Selection and Priority

1. SearchPageChart computes selected nodes as:
   1. If pathTree has at least one node: selectedNodeIds = pathTree.node IDs only.
   2. Otherwise: selectedNodeIds = union(clickedNodeIds, highlightedNodeIds).
2. Path nodes override search-result highlight nodes.
3. Renderer must not change selection semantics.

### Node Fill Priority

Priority order is strict:

1. done
2. selected
3. marked-for-study
4. inactive

Expected fill mapping:

1. skill + done: DONE_SKILL_FILL
2. url + done: DONE_URL_FILL
3. skill + selected: ACTIVE_SKILL_FILL
4. url + selected: ACTIVE_MODULE_FILL
5. any + marked-for-study (when not done/selected): MARKED_FOR_STUDY_FILL
6. skill + inactive: INACTIVE_SKILL_FILL
7. url + inactive: INACTIVE_MODULE_FILL

### Node Opacity

1. If pathTree is null or empty: all nodes opacity = 1.
2. If pathTree is active:
   1. nodes in pathTree.opacity = 1
   2. nodes not in pathTree.opacity = 0.25

### Link Color

1. done link (link.uuid in doneLinkIds): DONE_LINK_COLOR
2. else if link is in pathTree by source/target match: ACTIVE_LINK_COLOR
3. else: INACTIVE_LINK_COLOR

### Link Opacity

1. If pathTree is null or empty: all links opacity = 1.
2. If pathTree is active:
   1. links in pathTree opacity = 1
   2. links not in pathTree opacity = 0.2

## Interaction Parity (PoC v1)

### Required

1. Render nodes and directed links.
2. Pan and zoom must be available.
3. Clicking a node invokes onNodeClick(nodeId), updating selection state from parent.
4. Search-driven highlight updates must be reflected without page reload.
5. Path activation must dim non-path nodes/links while preserving path emphasis.

### Camera follow and touch (PoC v1)

1. Camera follow behavior is now required for PoC v1. The renderer must implement the same initial-focus and camera-follow semantics as the D3 baseline:
   - The renderer must accept an `initialFocusNodeId` prop and seed that node's position at the viewport target before the first layout/frame so the initial animation is visually centered on the focus node (D3 seeds at x=200, y=100 for viewBox 0 0 400 400).
   - While the layout is settling, the renderer must smoothly translate/scale the camera toward the focus node using linear interpolation (LERP). Use baseline parameters: `CAMERA_FOLLOW_LERP = 0.18` and `CAMERA_SETTLE_THRESHOLD = 0.5` (pixels). When the camera translation deltas fall under the threshold, stop the automatic camera adjustments.
   - The renderer's camera follow must support zoom preservation while translating (i.e., do not reset scale when centering on node).

2. Touch interactions are now required for PoC v1 and must provide parity with mouse interactions:
   - Pinch-to-zoom: two-finger pinch gestures must map to the same continuous zoom scale range as mouse wheel/trackpad (0.5–4).
   - Two-finger pan: allow translating the viewport via two-finger drag gestures that produce the same transform values as mouse pan.
   - Single-finger tap: tapping a node must invoke the same `onNodeClick(nodeId)` callback as mouse click.
   - Node touch start/end callbacks: the renderer must call provided `onNodeTouchStart` and `onNodeTouchEnd` props appropriately so higher-level code can implement long-press or mobile-specific behavior.
   - Touch gesture handling must be resilient to common mobile event ordering (prevent page scroll while interacting with graph area when applicable).

### Not Required in PoC v1

1. Node drag parity (dragging nodes to reposition them interactively can be postponed to v2).

## D3 Baseline Parameters to Keep Comparable

1. Viewport: svg viewBox 0 0 400 400, container width 100vw, height 85vh.
2. Zoom scale range: min 0.5, max 4.
3. Directed edges use arrow markers; state-specific markers differ by done/active/inactive.

Note: Alternative renderers do not need SVG marker implementation details, but directionality must remain visually clear.

## DOM/Test Observability Requirements

To keep integration tests stable across renderers, preserve these observables:

1. Graph container renders visibly when Search page loads.
2. Node click can be tested via role-independent graph node element interaction.
3. Current node is externally distinguishable (currently data-current=true on active node).
4. Done and study state are externally distinguishable for assertions.

If a renderer cannot expose identical SVG attributes, provide a renderer-neutral test adapter with equivalent semantics.

## Acceptance Checklist

A renderer passes parity only if all checks pass:

1. Search keyword "javascript" highlights matching nodes with ACTIVE_SKILL_FILL or ACTIVE_MODULE_FILL when no path is active.
2. Clicking a skill node highlights it with ACTIVE_SKILL_FILL.
3. Clicking a url node highlights it with ACTIVE_MODULE_FILL.
4. With active path:
   1. at least one in-path node has opacity 1
   2. at least one out-of-path node has opacity 0.25
   3. at least one in-path link has opacity 1
   4. at least one out-of-path link has opacity 0.2
5. Done nodes use done fills and preserve done/study coexistence rules.
6. Done links use DONE_LINK_COLOR.
7. No highlight regressions after search, path generation, or move-forward transitions.

## Known Baseline Caveat

Current repository baseline includes pre-existing test failures unrelated to this PoC start. Renderer parity comparisons must be judged against behavior defined in this spec plus targeted graph interaction checks, not solely by full-suite pass/fail.

## Approval Statement

Phase 1 parity spec is considered approved when this file is unchanged for one implementation cycle and both PoC renderers are evaluated against every checklist item above.
