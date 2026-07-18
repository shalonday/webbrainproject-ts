import D3Chart from "./D3Chart";
import type { GraphRendererProps } from "./graph-renderer-types";
import SigmaChart from "./SigmaChart";

type RendererMode = "d3" | "sigma";

// Flip this local constant to "sigma" when the Sigma renderer should be active.
const ACTIVE_RENDERER: RendererMode = "sigma";

/**
 * Renderer boundary that allows swapping graph implementations without changing
 * parent orchestration logic.
 */
function GraphRenderer(props: GraphRendererProps) {
  switch (ACTIVE_RENDERER) {
    case "d3":
      return <D3Chart {...props} />;
    case "sigma":
      return <SigmaChart {...props} />;
    default:
      return <D3Chart {...props} />;
  }
}

export default GraphRenderer;
