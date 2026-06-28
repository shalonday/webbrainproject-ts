# Chatbot Graph Highlight Integration

Replace chatbot path-generation links with graph-highlighting interactions. Chatbot related-material outputs will become clickable items that highlight nodes in the graph, optionally focus/pan to the clicked node, and persist until manually cleared. Chatbot highlights are additive with other highlight sources, and suppressed while a learning path is active.

## Decisions

- Keep link-like visual style for chatbot related material entries, but intercept click behavior (no path-generation navigation).
- Chatbot highlights persist until manually cleared.
- Highlights are additive: clicking chatbot result items adds to the existing chatbot highlight set; chatbot highlights are unioned with search highlights and manual node selection when no path is active.
- Path nodes take sole priority: when an active path exists, only path node IDs are highlighted and chatbot highlights are hidden.
- Clear controls appear in both the chatbot panel header and the bottom sheet controls area.

## Phases

### Phase 1 — Data flow and interaction contract

1. Add chatbot-highlight state in Search page flow: track `chatbotHighlightedNodeIds`, `focusedNodeId`, and a `clearChatbotHighlights` action at the Search level so both chatbot dialog and bottom sheet can invoke it from a single source of truth.
2. Extend `RAGChatbot` with two new callbacks:
   - `onRelatedMaterials(nodeIds: string[])` — fired immediately when an assistant response with `relatedMaterials` arrives; adds those IDs to `chatbotHighlightedNodeIds`.
   - `onRelatedMaterialClick(nodeId: string)` — fired when the user clicks a related-material item; adds that node ID and triggers a focus/pan in the graph.
3. Update message rendering so related-material items remain link-styled but do not navigate to `/paths/:start/:end`. Intercept the click event and route it to `onRelatedMaterialClick` instead.
4. Update `helpers.ts` (`formatAssistantMessage`) to stop calling `buildPathLink`; encode node IDs as data attributes or a custom scheme (e.g., `noderef://nodeId`) so `MessageBubble` can extract the target node ID without relying on path URLs.

### Phase 2 — Graph highlight precedence and visibility rules

5. Pass chatbot highlight IDs separately from search highlight IDs through the component tree into `SearchPageChart` (new prop: `chatbotHighlightedNodeIds`).
6. Implement merged highlight logic in `SearchPageChart`:
   ```
   if (pathTree has nodes):
     allSelectedNodeIds = pathNodeIds          // path wins, all other highlights hidden
   else:
     allSelectedNodeIds = union(
       manualSelectedNodeIds,
       searchHighlightedNodeIds,
       chatbotHighlightedNodeIds,
     )
   ```

### Phase 3 — Focus/pan behavior for clicked chatbot items

7. Add a `focusNodeId` prop to `D3Chart`. Wire a `useEffect` that, when `focusNodeId` changes, looks up the node's current simulation coordinates and applies a smooth zoom transform to center it in the viewport — without recreating the simulation.
8. Reuse the existing `ZoomBinding` / `zoomBehavior.transform` utilities already present in the file. After panning, clear `focusNodeId` in the parent so re-clicking the same item triggers another pan.

### Phase 4 — Clear controls

9. Add a clear button in the chatbot panel header (visible only when `chatbotHighlightedNodeIds.length > 0`).
10. Add a clear button in `ActionButtons` (bottom sheet controls area), also gated on `chatbotHighlightedNodeIds.length > 0`. Both invoke the same `clearChatbotHighlights` handler owned at the Search level.

### Phase 5 — Tests, regression checks, and docs

11. Update `RAGChatbot.test.tsx`:
    - Assert related-material links no longer have path-navigation `href` attributes.
    - Assert `onRelatedMaterials` callback is invoked with correct node IDs when a response arrives.
    - Assert `onRelatedMaterialClick` is invoked with the correct node ID when a related item is clicked.
12. Add tests for highlight precedence in `SearchPageChart`:
    - Path nodes take sole priority when `pathTree` is active.
    - Chatbot + search + manual highlights are unioned when no path is active.
    - Union grows additively as more chatbot items are clicked.
13. Add tests for clear-control visibility and invocation:
    - Controls are hidden when `chatbotHighlightedNodeIds` is empty.
    - Controls appear and invoke `clearChatbotHighlights` when IDs are present, in both chatbot dialog and bottom sheet.
14. Update `docs/architecture.md` to document the new chatbot-to-graph interaction flow.
15. Run targeted tests, then full suite and lint to confirm no regressions.

## Relevant files

| File                                               | Change                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/pages/search/Search.tsx`                      | Own `chatbotHighlightedNodeIds`, `focusedNodeId`, `clearChatbotHighlights`; wire to chatbot, chart, bottom sheet |
| `src/pages/search/useSearchPageState.ts`           | Expose chatbot highlight/focus fields and handlers                                                               |
| `src/pages/search/SearchPageChart.tsx`             | Accept `chatbotHighlightedNodeIds` prop; implement additive highlight merge and path-priority suppression        |
| `src/pages/search/D3Chart.tsx`                     | Add `focusNodeId` prop and zoom-to-node effect                                                                   |
| `src/pages/search/chatbot/RAGChatbot.tsx`          | Add `onRelatedMaterials` and `onRelatedMaterialClick` callbacks; fire them at the right points                   |
| `src/pages/search/chatbot/MessageBubble.tsx`       | Intercept related-material link clicks; forward node IDs via callback                                            |
| `src/pages/search/chatbot/helpers.ts`              | Stop generating path URLs; encode node IDs for callback extraction                                               |
| `src/pages/search/components/BottomSheet.tsx`      | Thread `chatbotHighlightedNodeIds` and `onClearChatbotHighlights` into controls                                  |
| `src/pages/search/components/ActionButtons.tsx`    | Render conditional clear-chatbot-highlights button                                                               |
| `src/pages/search/chatbot/RAGChatbot.test.tsx`     | Update/add chatbot behavior assertions                                                                           |
| `src/pages/search/components/BottomSheet.test.tsx` | Add/extend clear-control tests                                                                                   |
| `docs/architecture.md`                             | Document updated chatbot/graph interaction flow                                                                  |

## Verification

```bash
npm run test:run   # full test suite
npm run lint       # lint
```

Manual checks:

1. Send chatbot prompt that returns related materials → nodes highlight immediately.
2. Click a related item → graph pans/focuses to that node, highlight remains, other existing highlights also remain.
3. Click another related item → its node ID is added to highlights additively.
4. Run a search while chatbot highlights exist → search highlights are unioned with chatbot highlights.
5. Generate a path → chatbot (and search) highlights disappear; only path nodes are highlighted.
6. End path → chatbot highlights reappear (they were never cleared, just suppressed).
7. Clear highlights from chatbot panel header → chatbot highlight set empties.
8. Re-add chatbot highlights, then clear from bottom sheet → same result.

## Further considerations

- **Focus animation**: use smooth zoom transform; fall back to immediate transform if target node coordinates are not yet stable.
- **Accessibility**: ensure related-material items are keyboard-activatable (`role="button"` or `<button>`); add `aria-label` to clear buttons in both surfaces.
- **Missing node safety**: if chatbot returns a `nodeId` absent from the current tree, silently ignore that ID and retain existing highlights.
