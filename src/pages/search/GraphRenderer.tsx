import D3Chart from "./D3Chart";
import type { GraphRendererProps } from "./graph-renderer-types";

type RendererMode = "d3" | "sigma";

// Phase 1 keeps D3 as the default implementation while Sigma is developed.
const ACTIVE_RENDERER: RendererMode = "d3";

/**
 * Renderer boundary that allows swapping graph implementations without changing
 * parent orchestration logic.
 */
function GraphRenderer(props: GraphRendererProps) {
  switch (ACTIVE_RENDERER) {
    case "d3":
      return <D3Chart {...props} />;
    case "sigma":
      // Sigma implementation is intentionally deferred to later phases.
      return <D3Chart {...props} />;
    default:
      return <D3Chart {...props} />;
  }
}

export default GraphRenderer;