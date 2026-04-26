## Store Progress Specification

### Summary

Add persistent learning progress storage to the Search and Path experience using browser local storage, and support progress sharing through JSON export and import.

In this phase, browser `localStorage` is the primary and authoritative persistence layer for in-browser progress.

Persisted progress must:

1. Reflect immediately on the universal tree shown on app open.
2. Influence generated path traversal so completed items are not treated as fresh work.
3. Support file transfer across browsers/users for now (no identity binding in this phase).

### Problem Statement

Current path progress exists only in runtime state. Users lose done-node/link progress on refresh or browser switch, and cannot share a progress state with others. This blocks continuity and collaboration use cases.

### Goals

1. Persist done nodes and links locally across sessions.
2. Rehydrate and visualize persisted progress on initial universal tree load.
3. Preserve existing path highlight behavior while overlaying done state.
4. Enable JSON export of progress.
5. Enable JSON import with deterministic conflict strategies when local progress exists.
6. Keep behavior deterministic and testable.

### Non-goals (This Phase)

1. User identity, profile binding, or anti-cheat validation.
2. Signed/encrypted progress files.
3. Backend/cloud persistence.
4. Skill-test completion auto-marking (done source remains Move Forward).

### User Stories

1. As a learner, I reopen the site and immediately see what I already completed.
2. As a learner, when I generate a path that includes already-done items, I continue from appropriate not-done work instead of restarting early nodes.
3. As a learner, I can export my progress and share it.
4. As a learner receiving a shared file, I can import it with clear conflict choices.
5. As a developer, I can validate all import outcomes with deterministic rules.

### Definitions

1. Done node: a node marked completed by in-app traversal flow.
2. Done link: a link marked completed according to existing traversal semantics.
3. Marked-for-study node: a planning marker indicating study target, not completion.
4. Study-Diff: import strategy that marks loaded-only done nodes for study without changing local done state.
5. Loaded-only done nodes: importedDoneNodeIds minus existingLocalDoneNodeIds, computed from pre-import local state.

### Scope and Integration

This specification aligns with existing ownership in:

1. `src/pages/search/useLearningPathNavigator.ts`
2. `src/pages/search/search-utils.ts`
3. `src/pages/search/D3Chart.tsx`
4. `src/pages/search/graph-styles.ts`
5. `src/utils/progress.ts`
6. `src/components/chatbot/storage.ts`

### Progress Data Contract

Persist a versioned JSON object with:

1. schemaVersion
2. lastUpdated
3. doneNodeIds
4. doneNodeTimestamps (map of nodeId -> ISO-8601 timestamp)
5. doneLinkIds
6. doneLinkTimestamps (map of linkId -> ISO-8601 timestamp)
7. markedForStudyNodeIds
8. optional metadata for forward compatibility

Rules:

1. doneNodeIds and doneLinkIds are deduplicated.
2. markedForStudyNodeIds is deduplicated.
3. Unknown optional fields are tolerated.
4. Invalid required shapes are rejected for import and treated as corrupt for local rehydrate fallback.

### Local Storage Contract

For this phase, progress persistence is implemented in browser `localStorage`.

1. A dedicated `localStorage` entry stores the full progress payload.
2. Startup hydration reads this entry before rendering persisted done-state indicators.
3. Progress writes are write-through from path traversal updates.
4. Import strategies (`Merge`, `Replace`, `Study-Diff`) update in-memory state and then persist the resulting state to `localStorage`.
5. `localStorage` read/write failures must not block core navigation; failures surface a non-blocking warning and the app remains usable.

### Persistence Behavior

#### Startup Hydration

1. On app load, read local progress from browser `localStorage`.
2. If valid, apply done state to universal-tree visualization immediately.
3. If missing, start empty state.
4. If corrupt, fail safe to empty state and surface non-blocking warning.

#### Path Generation and Traversal

1. Path generation shows no conflict prompt.
2. Persisted done state influences traversal behavior and current-node progression.
3. Path-view highlighting remains unchanged; done overlays remain visible.
4. Move Forward continues to be the only in-phase source of done state updates.
5. Whenever Move Forward changes done-state collections, persist the updated progress payload to `localStorage` immediately.
6. Whenever Move Forward marks a node or link as done, record an ISO-8601 timestamp for that item in `doneNodeTimestamps` / `doneLinkTimestamps` using the current local time.

### Import and Export Behavior

#### Export

1. Export current local progress as JSON file.
2. Include schemaVersion and timestamps.
3. Output is portable across browsers/users in this phase.
4. Export is initiated from a persistent floating action button.
5. The export button is available in both path view and non-path view.
6. Export does not require the no-active-path condition; it remains available while a path is active.

#### Import Availability Gating

Import controls are accessible only when there is no active path, defined as:

1. pathTree is absent, or
2. current route is not /paths/:startId/:endId

#### Import Flow

1. User selects JSON file.
2. App validates schema and IDs.
3. If no local progress exists, import applies directly.
4. If local progress exists, user must select exactly one strategy:

- Merge
- Replace
- Study-Diff

For conflict cases, Merge and Replace are available only after the user checks a confirmation box:

- "I own the progress saved in this file"

Study-Diff remains available without this confirmation.

5. App applies selected strategy and shows success/failure message.

### Import Strategy Semantics

#### Merge

Precondition:
User has checked: "I own the progress saved in this file".

1. doneNodeIds becomes union of local and imported.
2. doneLinkIds becomes union of local and imported.
3. markedForStudyNodeIds merges by union unless future product rules say otherwise.
4. For per-item timestamps: `doneNodeTimestamps` and `doneLinkTimestamps` become the union of keys. For IDs present in both local and imported maps, choose the latest ISO-8601 timestamp (max) to represent the most recent review/completion time.
5. lastUpdated MUST be the ISO-8601 timestamp when this payload was written to localStorage (i.e., now).

#### Replace

Precondition:
User has checked: "I own the progress saved in this file".

1. Imported progress fully overwrites local progress fields.
2. Resulting state equals imported payload after normalization.
3. For per-item timestamps: the resulting `doneNodeTimestamps` and `doneLinkTimestamps` are taken directly from the imported payload.

#### Study-Diff

1. Keep local doneNodeIds unchanged.
2. Keep local doneLinkIds unchanged.
3. Add loaded-only done nodes to markedForStudyNodeIds:

- loaded-only = importedDoneNodeIds minus existingLocalDoneNodeIds

4. existingLocalDoneNodeIds is taken from pre-import local state.
5. This strategy does not mark any additional nodes as done.
6. Study-Diff does not write per-item done timestamps into local `doneNodeTimestamps`/`doneLinkTimestamps`.

### Validation Requirements

1. Enforce JSON parse safety.
2. Validate required fields and types.
3. Validate node/link IDs format consistency with existing graph ID expectations.
4. Deduplicate all ID collections before persistence.
5. Reject malformed payloads with actionable user feedback.
6. Never mutate local state on failed import.
7. `localStorage` write failures are handled gracefully (no crash, non-blocking user feedback).

### UX Requirements

1. Universal tree clearly reflects done state on load using done color.
2. Import dialog presents three mutually exclusive strategies at the same hierarchy level.
3. Import/export controls are keyboard accessible.
4. Export is exposed through a floating action button that remains available in both path and non-path views.
5. Merge and Replace controls stay disabled until the user checks: "I own the progress saved in this file".
6. Study-Diff stays enabled without the ownership confirmation.
7. Messaging clearly explains outcomes of Merge, Replace, and Study-Diff.
8. Error states are non-destructive and understandable.

### Testing Strategy

#### Unit

1. Serialization and deserialization.
2. Schema validation and rejection paths.
3. Merge semantics.
4. Replace semantics.
5. Study-Diff set-difference semantics.
6. Deduplication and timestamp rules.

#### Integration

1. Startup hydration from valid local storage.
2. Corrupt local storage fallback.
3. Import gating by no-active-path rule.
4. Import with each strategy when local progress exists.
5. Path generation behavior with persisted done data.
6. Move Forward updates persist to `localStorage` on each done-state change.

#### UI

1. Universal tree done color on open.
2. Path view keeps current highlight behavior plus done overlays.
3. Import dialog strategy selection and result messaging.
4. Floating export action remains available in both path and non-path views.

#### Negative

1. Malformed JSON.
2. Wrong schema shape.
3. Invalid IDs.
4. localStorage unavailable or quota failures.

### Acceptance Criteria

1. Reopening app rehydrates and displays done progress on universal tree.
2. Generated paths respect existing done progress without restart prompts.
3. Export produces valid schema-versioned JSON.
4. Export remains available from the floating action button in both path and non-path views.
5. Import is blocked unless no-active-path rule is satisfied.
6. In conflict cases, Merge and Replace require ownership self-confirmation and Study-Diff does not.
7. Import conflict resolution supports Merge, Replace, and Study-Diff exactly as specified.
8. Study-Diff only creates marked-for-study from loaded-only done nodes.
9. Failed import never alters existing local progress.
10. After each Move Forward that changes done-state, `localStorage` reflects the updated progress payload.

### Documentation Hygiene

When implementation lands, reflect architecture updates in:

1. [docs/architecture.md](../architecture.md)
