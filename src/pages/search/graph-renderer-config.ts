export type GraphRenderer = "d3" | "sigma" | "reagraph";

const DEFAULT_GRAPH_RENDERER: GraphRenderer = "d3";

/**
 * Returns a safe renderer selection from Vite env.
 * Unknown values always fall back to D3 for safe rollback.
 */
function resolveGraphRendererFromEnv(): GraphRenderer {
  const rawRenderer = import.meta.env.VITE_GRAPH_RENDERER;

  if (rawRenderer === "sigma") {
    return "sigma";
  }

  if (rawRenderer === "reagraph") {
    return "reagraph";
  }

  return DEFAULT_GRAPH_RENDERER;
}

export const activeGraphRenderer: GraphRenderer = resolveGraphRendererFromEnv();
