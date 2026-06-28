# Renderer Experiment Config (Phase 0)

## Objective

Define a single, reversible renderer-selection mechanism for Search graph experiments while keeping D3 as default.

## Single Source of Truth

- Config file: src/pages/search/graph-renderer-config.ts
- Export: activeGraphRenderer
- Allowed values: d3, sigma, reagraph
- Fallback behavior: any unknown value resolves to d3

## Runtime Control

- Environment variable: VITE_GRAPH_RENDERER
- Supported values:
  - d3 (default)
  - sigma (planned)
  - reagraph (planned)

## Current Behavior (Phase 0)

- SearchPageChart reads activeGraphRenderer.
- Only D3 is currently implemented.
- If VITE_GRAPH_RENDERER is sigma or reagraph, SearchPageChart logs a warning and safely falls back to D3.

## Why This Design

1. Minimal code churn in existing Search flow.
2. Fast rollback path by resetting env to default.
3. Ready seam for Phase 3/4 renderer implementation.

## Example Env Settings

- Default behavior (recommended now):
  - Do not set VITE_GRAPH_RENDERER, or set VITE_GRAPH_RENDERER=d3
- Future Sigma PoC run:
  - VITE_GRAPH_RENDERER=sigma
- Future Reagraph PoC run:
  - VITE_GRAPH_RENDERER=reagraph

## Validation Checklist

1. With default env, Search uses D3 with no behavior change.
2. With unknown env value, app does not crash and still uses D3.
3. With sigma/reagraph env values before implementation, warning is logged and D3 is used.

## Follow-up in Later Phases

1. Implement SigmaChart and route via activeGraphRenderer.
2. Implement ReagraphChart and route via activeGraphRenderer.
3. Add renderer-specific tests under same selection seam.
