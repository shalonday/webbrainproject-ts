# Store Progress — Implementation Plan

This file lists the concrete implementation steps I (the AI) will perform to implement the spec in `docs/store-progress/specifications.md`. Each step includes file targets, success criteria, and testing notes.

1. Create `src/utils/progressStorage.ts` (or extend `src/utils/progress.ts`)

- Purpose: canonical local persistence + import/export/validation helpers.
- Exposed API:
  - `getLocalProgress(): ProgressPayload | null`
  - `saveLocalProgress(payload: ProgressPayload): void`
  - `validateProgressPayload(obj: unknown): ValidationResult`
  - `exportProgress(): string` (returns JSON)
  - `importProgressFromFile(file: File, strategy: 'Merge'|'Replace'|'Study-Diff'): Promise<ImportResult>`
  - `clearLocalProgress()`
- Implementation details:
  - Use dedicated `localStorage` key: `webbrain:progress:v1`.
  - All timestamps are ISO-8601 strings.
  - Use `doneNodeTimestamps` / `doneLinkTimestamps` as the canonical done-state source.
  - Derive done IDs with `Object.keys(doneNodeTimestamps)` / `Object.keys(doneLinkTimestamps)` wherever ID-only collections are needed.
  - Deduplicate derived ID lists and normalize payload shape on write.
  - Wrap `localStorage` ops in try/catch; surface non-blocking warnings via returned error objects.
  - Implement merge/replace/study-diff semantics including per-item timestamp resolution (merge chooses `max` timestamp; replace uses imported timestamps).
- Tests: `src/utils/progress.test.ts` covering serialization, validation, merge/replace/study-diff.

2. Hydration & persistence hooks in `useLearningPathNavigator.ts`

- On app/navigation startup, call `getLocalProgress()` and hydrate in-memory progress state before rendering the universal tree.
- On each Move Forward event that updates done collections, call `saveLocalProgress()` with the updated payload and set `lastUpdated` to current datetime.
- Ensure write-through is debounced minimally (if needed) but remains immediate for spec compliance.
- Tests: integration test that simulates Move Forward and asserts `localStorage` updated.

3. Ensure traversal logic respects persisted state in `search-utils.ts`

- Where path generation or progression logic computes next nodes, derive `doneNodeIds`/`doneLinkIds` from persisted timestamp maps so already-done items are skipped/treated appropriately.
- Add unit tests verifying path generation with combined persisted done state (including post-import merge outcomes).

4. Visualization updates in `D3Chart.tsx` / `graph-styles.ts`

- Derive `doneNodeIds` from `doneNodeTimestamps` and use both to draw done overlays and optional tooltip showing "completed on <timestamp>".
- Ensure marked-for-study nodes are styled per `graph-styles.ts` (reuse existing done color tokens where appropriate).
- Tests: snapshot or DOM test that universal tree renders done overlays after hydration.

5. Import / Export UI components

- Create `src/components/progress/ExportButton.tsx` (floating action button) which calls `exportProgress()` and triggers file download. Visible in path and non-path views.
- Create `src/components/progress/ImportDialog.tsx` (file picker + strategy selector + ownership checkbox). Behavior:
  - Gate: only enabled when no active path (use `useLearningPathNavigator` state or router match).
  - Validate file client-side with `validateProgressPayload`.
  - If local progress exists, require selecting exactly one strategy and check ownership box for Merge/Replace.
  - Apply strategy via `progressStorage.importProgressFromFile(...)` and persist the resulting local state.
- Accessibility: keyboard-focusable, aria labels, clear messaging for outcomes.
- Tests: UI tests for gating, confirmation checkbox behavior, and success/error messaging.

6. Test coverage

- Unit tests: `src/utils/progress.test.ts` for serialization, validation, timestamp merge rules.
- Integration tests: simulate startup hydration, Move Forward persistence, import strategies.
- UI tests (Vitest + React Testing Library): import dialog flows, export button presence during active path.
- Negative tests: malformed JSON, invalid IDs, `localStorage` unavailable (mock), quota failure handling.

7. Documentation updates

- Update `docs/architecture.md` with a short section describing `progressStorage`, where persistence hooks are located (`useLearningPathNavigator.ts`), and UI entry points (`ExportButton`, `ImportDialog`).

8. Run tests and formatting

- Run `npm run test:run` and fix any issues introduced.
- Run `npm run lint -- --fix` (or repo's lint command) and format changed files.

Acceptance criteria (for the implementation steps):

- `localStorage` key `webbrain:progress:v1` contains a normalized payload with `schemaVersion`, `lastUpdated`, `doneNodeTimestamps`, `doneLinkTimestamps`, `markedForStudyNodeIds`, and `metadata`.
- Any required ID-only collections are derived from timestamp map keys, not persisted as separate arrays.
- Hydration applies done overlays immediately on app load.
- Move Forward updates `localStorage` with current timestamp `lastUpdated` and per-item timestamps for items newly marked done.
- Import/export flows behave per spec (Merge/Replace/Study-Diff) and UI gating works.

Timeline & next actions I will perform now if you approve:

- Create this implementation doc (done).
- Implement the `progressStorage` module and unit tests.
- Integrate persistence hooks into `useLearningPathNavigator.ts` and add minimal UI stubs for import/export.

If you approve, I'll start by implementing `src/utils/progressStorage.ts` and its unit tests. (I will update the todo list as I complete steps.)
