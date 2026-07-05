# Web Brain Project - AI Coding Guidelines

**Note**: The repo is currently minimal, with only basic setup and README, as we're restarting from scratch.

## Project Overview

The Web Brain Project (WBP) is a React TypeScript application using Vite. It aims to organize educational content in a graph structure. It connects skills and online learning resources via prerequisite relationships to create personalized learning paths.

**Key Concept**: Skills and URLs form a directed graph with two types of edges:

- `Skill -> [IS_PREREQUISITE_TO] -> URL`: The skill is required to understand the URL's content
- `URL -> [TEACHES] -> Skill`: The URL teaches the skill (objective skill)

Example: `Skill A -> URL -> Skill B` means URL teaches Skill B requiring Skill A.

Note that a URL can have multiple prerequisite skills, and multiple objective skills as well.

**Data Model Notes**: When creating nodes of type `url`, the `name` property must always contain the actual URL string (e.g., `"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"`), not a descriptive label.

## Architecture & Data Flow

- **Frontend**: React 19 with TypeScript, built with Vite
- **Data Structure**: Graph with nodes (skills/URLs) and edges (prerequisites/objectives)
- **State Management**: Context API for graph data
- **Persistence**: Local browser storage for user progress

## Development Workflow

- **Start Development**: `npm run dev` (Vite dev server)
- **Build**: `npm run build` (TypeScript compilation + Vite build)
- **Lint**: `npm run lint` (ESLint with flat config, auto-fixes where possible)
- **Test**: `npm test` (Vitest with React Testing Library)
- **Test UI**: `npm run test:ui` (Vitest UI for interactive testing)
- **Test Run**: `npm run test:run` (Run tests once)
- **Preview**: `npm run preview` (Serve built app)

## Code Conventions

- **TypeScript**: Strict mode enabled, no unused locals/parameters
- **React**: Functional components with hooks, JSX transform
- **Imports**: ES modules with verbatim syntax
- **Linting**: Flat ESLint config with React hooks, refresh, accessibility, JSDoc, and import sorting plugins. Enforces camelCase variables, camelCase/PascalCase functions (for components), PascalCase types, semicolons (via @stylistic), no console logs, alphabetical imports, JSX keys, no prop mutation, and JSDoc on exports (warn)
- **Readability**: Prioritize human-readable code and tests. Make functions modular and encapsulated with comprehensive JSDoc comments. Have clear entrypoints for functionality, and clearly distinguish between primary functions and helper functions through naming, organization, and documentation

## Documentation Hygiene

- Keep `docs/architecture.md` up to date whenever architecture or file structure changes (flows, ownership of modules, extracted utilities, or visualization helpers).

## Key Files

- `src/App.tsx`: Main app component (currently placeholder)
- `src/main.tsx`: React root rendering
- `vite.config.ts`: Vite configuration
- `tsconfig.*.json`: TypeScript project references (app/node separation)

## Path Traversal Rules

When navigating a learning path (Move Forward), these rules govern node ordering:

- **URL priority**: When a URL is completed, its taught skills (outgoing edges from the URL) are prepended to the **front** of the queue for immediate practice, before any other pending nodes.
- **Skill batching**: When a skill is completed, outgoing URLs are appended to the **back** of the queue, each grouped with their respective taught skills.
- **Prerequisite gating**: A URL node is only eligible to visit when all its required skill prerequisites (incoming skill edges in the universal tree) are done.
- **Session resume**: On path generation, if prior done-state exists in localStorage, traversal simulates progress through all done nodes — applying the same URL-priority queue rules — to arrive at the correct frontier node and queue state.

## Implementation Patterns (Future)

- Graph visualization: D3.js
- Search: Fuzzy search over skills/URLs
- Path generation: Graph traversal algorithms
- Skill assessment: Interactive quizzes
- Progress tracking: Local storage with JSON serialization

## Dependencies

- **Runtime**: React 19, React DOM, Material UI (@mui/material, @emotion/react, @emotion/styled)
- **Build**: Vite, TypeScript 5.9
- **Lint**: ESLint 9 with TypeScript, React, accessibility, JSDoc, import, and stylistic plugins
- **Testing**: Vitest, Mock Service Worker, React Testing Library

Focus on graph algorithms and educational UX when implementing features.

Run all commands on Git Bash instead of Powershell

## Coding style for AI assistants

When generating, refactoring, or suggesting code, follow these rules to maximize human readability and maintainability:

- **Readability**: Prefer clarity over cleverness. Use descriptive names; avoid one-letter names except loop indices.
- **Modularity**: Break complex logic into small functions (single responsibility, ideally under ~40 lines).
- **Naming**: Name functions for intent, e.g. `buildSigmaGraphFromTree`, `formatTimestampForDisplay`.
- **Comments**: Add concise inline comments for non-obvious logic and a short header comment at the top of modules explaining purpose.
- **JSDoc**: Include JSDoc for all exported functions and types with `@param` and `@returns` descriptions.
- **Pure functions**: Prefer pure/value-returning functions; make mutation explicit in names when mutating.
- **Tests**: Add or update unit tests for new behavior and significant refactors.
- **Refactor practice**: When proposing refactors, include a small, behavior-preserving diff and tests if possible.
- **Examples**: Provide a short usage example or code comment when helpful.

### Suggested JSDoc + refactor pattern

Example JSDoc for an exported function:

```ts
/**
 * Builds a deterministic Graphology graph from a WebBrain tree.
 *
 * @param params - Creation options and input tree
 * @returns A directed Graphology graph with node and edge attributes for Sigma.
 */
export function buildSigmaGraph(params: CreateSigmaGraphParams): DirectedGraph<...> { ... }
```

Refactor pattern:

- Extract helpers: `createNodes(graph, nodes, options)`, `createEdges(graph, links, options)`, `getNodePayload(node, index, total, options)`
- Keep the top-level function small: orchestration only, delegate details to helpers.

When in doubt, prioritize human readers: other engineers will maintain this code for years.
