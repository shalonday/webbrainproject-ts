# Double-click handlers + shortest-path highlight

TL;DR - Add double-click behavior on graph nodes: for `url` nodes open the URL; for `skill` nodes open the skill route and show a confirmation dialog. If the user selects the confirmation radio and closes the dialog, call a new backend endpoint to compute the shortest path from entry node `E` to that skill, then highlight the returned nodes and links while preserving existing Done state.

## Steps

1. Design backend endpoint (perk-api)
   - Add `GET /paths/shortest/:targetNodeId` that computes the shortest path from `E` to `:targetNodeId` using a parameterized Cypher `shortestPath(...)` query. Return `{ nodes: [...], links: [...] }` in the same shape as existing `/paths/:start/:target` responses.
   - Implement `readShortestPath` in `services/service.js` using `session.executeRead()` or `session.readTransaction()` and parameterized query; handle no-path case (return empty nodes/links, 404 optional).
   - Wire route in `app.js`.
   - Add unit tests for the endpoint (mock Neo4j driver) and basic error handling.

2. Frontend: node double-click plumbing
   - Add `onNodeDoubleClick` prop to `SigmaChart` and listen for Sigma's `doubleClickNode` event when initializing the renderer. Use Sigma's event API.
   - Update parent search page to pass a handler which distinguishes node types.

3. Frontend: UI dialog + state
   - Reuse existing `SkillModal` component located at `src/pages/search/components/SkillModal.tsx` (it already provides the radio and confirm flow).
   - Add state in path/navigation context or search page: `pendingSkillId`, `isSkillModalOpen`, `isSkillConfirmed`, `highlightPathTree` (nullable tree object), and `isLoadingHighlight`.
   - Ensure single-click interactions remain unchanged; wire double-click only to new flow.

4. Frontend: shortest-path fetch & highlight
   - On dialog confirm closure, call `GET ${BASE_URL}/paths/shortest/${pendingSkillId}`.
   - On success, set `highlightPathTree` to response `{ nodes, links }`.
   - Pass `highlightPathTree` into `SigmaChart` as a new prop (e.g., `highlightPathTree`) and modify `SigmaChart` to use `highlightPathTree` when computing `isLinkInPath` / `isNodeInPath` for opacity/marker styling. Fall back to existing `pathTree` when highlight not present.
   - Do alter `doneNodeIds` / `doneLinkIds` by adding the nodes and links in the shortest path that were not already done; the highlight should overlay on top while preserving existing done visuals (graph-styles already prioritizes done state in `getNodeFill`).

5. Cleanup, tests, and UX polish
   - Add feedback for loading/failure when fetching path.
   - Make sure keyboard accessibility: dialog focus trap + confirm via keyboard.
   - Add automated tests (unit/test utils) to verify double-click handler logic (mock Sigma events), dialog gating, and API call.

## Relevant files (edit or add)

- `perk-api/app.js` — add route for shortest-path
- `perk-api/services/service.js` — implement `readShortestPath(req, res)`
- `perk-api/services/neo4j/neo4jHelpers.js` — (optional) add helper to convert relationships to link format if needed
- `webbrainproject-ts/src/pages/search/SigmaChart.tsx` — add `onNodeDoubleClick` prop, listen for Sigma `doubleClickNode` events, accept `highlightPathTree` prop and use it in styling functions
- `webbrainproject-ts/src/pages/search/useLearningPathNavigator.ts` — add states and handlers: `pendingSkillId`, `highlightPathTree`, `setHighlightedPathTree`, expose `setIsSkillModalOpen` (already exists) and fetch helper
- `webbrainproject-ts/src/pages/search/components/SkillModal.tsx` — reuse existing dialog component
- `webbrainproject-ts/src/pages/search/SearchPage.tsx` (or the parent that renders `SigmaChart`) — pass handler and render `SkillConfirmDialog`
- `webbrainproject-ts/src/pages/search/graph-styles.ts` — ensure functions prioritize `highlightPathTree` if passed or make no changes if `SigmaChart` forwards the correct prop
- Tests: `perk-api/__tests__/shortestPath.test.js`, `webbrainproject-ts/src/pages/search/__tests__/doubleClick.test.tsx`

## Verification

1. Backend unit tests: mock Neo4j driver to validate `readShortestPath` returns expected nodes/links and handles no-path condition.
2. Frontend unit tests: simulate `dblclick` on a URL node => `window.open` is invoked with `node.name`; simulate `dblclick` on a skill node => dialog opens.
3. End-to-end manual check:
   - Run backend and frontend locally.
   - Open graph, double-click a URL node → new tab opens with URL.
   - Double-click a skill node → new tab opens `/skill-test/:id` and the confirmation dialog appears.
   - Select the confirmation radio and click Confirm → the shortest path from `E` to the skill is highlighted (nodes/links); previously Done items keep Done styling.
4. Visual regression: ensure done-state colors still override highlight for done items.

## Decisions & Assumptions

- Use entry node UUID `E` (existing special node) as the path start.
- Add route `GET /paths/shortest/:targetNodeId` rather than changing existing `readPath` to avoid regressions.
- The backend will use parameterized Cypher to avoid injection; service.js currently contains non-parameterized templates — update new function to use parameters.
- Highlighting is a UI overlay, but confirming and closing the dialog also promotes any newly covered shortest-path nodes and links into the existing done state collections.

## Further Considerations / Questions

1. Confirm the exact dialog text and whether the dialog should appear in the same tab (overlay) or only open the skill-test tab first. Recommendation: open the skill-test tab and also show dialog in the graph tab (current pattern in `useLearningPathNavigator` supports opening `/skill-test` then toggling modal).
2. Confirm endpoint path style (I proposed `/paths/shortest/:targetNodeId`) — OK to proceed?
3. Is there an existing shared dialog component library to reuse for `SkillConfirmDialog`? If not, I'll add a minimal MUI-based modal in `src/pages/search`.
