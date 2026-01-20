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

## Key Files

- `src/App.tsx`: Main app component (currently placeholder)
- `src/main.tsx`: React root rendering
- `vite.config.ts`: Vite configuration
- `tsconfig.*.json`: TypeScript project references (app/node separation)

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
