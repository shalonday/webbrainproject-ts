# Architecture and Data Flow

## Frontend stack

- React 19 + TypeScript via Vite.
- State for the universal graph comes from the `SkillTreesContext` (tree + loading flag).
- Tests: Vitest + Testing Library + MSW.

## Search page responsibilities

- `useSearchPageState`: page orchestrator. Manages search term/results/selection, pulls the universal tree from context, computes highlighted nodes, and hands the selected result ID to the navigator.
- `useLearningPathNavigator`: path generation/traversal. Fetches a path from `BASE_URL/paths/{start}/{target}`, tracks path tree/current node/done links & nodes, and exposes handlers for moving forward and logging landings.
- Render layer: `Search.tsx` remains thin, wiring the two hooks into UI (cards, buttons, list) and passing state to `SearchPageChart`.
- Flow (high level): user types → confirms search → selects a result → `useSearchPageState` sends `selectedResultId` to `useLearningPathNavigator` → path is fetched and stored → `Search.tsx` renders path list + passes highlighting to the chart.

## Graph visualization

- `D3Chart.tsx`: owns the force simulation, zoom/drag, and renders SVG markers. Styling/highlight helpers live in `graph-styles.ts` to keep D3Chart lean.
- Highlighting rules: path nodes/links stay fully opaque; off-path are dimmed; done nodes/links use the DONE palette; selection toggles active fills.

## Progress persistence

- `src/utils/progressStorage.ts`: canonical persistence module. Reads/writes a versioned `ProgressPayload` to `localStorage` under key `webbrain:progress:v1`. Exposes `getLocalProgress`, `saveLocalProgress`, `clearLocalProgress`, `exportProgress`, `validateProgressPayload`, and `importProgressFromFile` (supports Merge, Replace, and Study-Diff strategies). All `localStorage` operations are wrapped in try/catch so failures never block navigation.
- `useLearningPathNavigator.ts`: hydrates done-state from `localStorage` on mount and persists updates on every Move Forward. Exposes `refreshFromStorage()` for external callers (e.g., import) to re-sync in-memory state after `localStorage` mutations that bypass the hook.
- UI entry points in `src/components/progress/`:
  - `ExportButton.tsx`: floating action button that serializes current progress to JSON and triggers a file download. Always visible.
  - `ImportDialog.tsx`: floating action button + dialog for importing a progress JSON file. Gated (disabled when a learning path is active). Validates the file, presents strategy selection when local progress exists, enforces ownership confirmation for Merge/Replace, and calls `refreshFromStorage` on success.

## Data model notes

- Graph nodes: `skill` and `url`. For `url` nodes, `name` must be the literal URL string (not a label).
- Edges: `IS_PREREQUISITE_TO` from skill → url; `TEACHES` from url → skill. A URL can have multiple prerequisites and teach multiple skills.

## Contributing hygiene

- Keep this file updated when architecture or file structure changes (especially search flow, graph helpers, or shared utilities).
- Prefer adding JSDoc to exported helpers/hooks to keep intent discoverable.
- When extracting shared logic, prefer colocated utility modules (e.g., `search-utils.ts`, `graph-styles.ts`) and leave renderers thin.
