import { vi } from "vitest";

const sigmaMockInstances = (globalThis as { __sigmaMockInstances?: unknown[] }).__sigmaMockInstances;

type MockGraph = {
  nodes: () => string[];
  getNodeAttributes: (nodeId: string) => Record<string, unknown>;
};

type MockSettings = Record<string, unknown>;

class MockSigma {
  handlers: Record<string, (...args: unknown[]) => void> = {};
  graph: MockGraph;
  settings: MockSettings;

  constructor(graph: MockGraph, _container: unknown, settings: MockSettings) {
    this.graph = graph;
    this.settings = settings;
    sigmaMockInstances?.push(this);
  }

  getCamera() {
    return {
      animate: vi.fn().mockResolvedValue(undefined),
      getState: () => ({ angle: 0, ratio: 1, x: 0, y: 0 }),
      setState: vi.fn(),
    };
  }

  getCustomBBox() {
    return null;
  }

  getDimensions() {
    return { height: 600, width: 800 };
  }

  getBBox() {
    const nodes = this.graph.nodes();

    if (!nodes.length) {
      return { x: [0, 0], y: [0, 0] };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const nodeId of nodes) {
      const attributes = this.graph.getNodeAttributes(nodeId);
      const x = typeof attributes.x === "number" ? attributes.x : 0;
      const y = typeof attributes.y === "number" ? attributes.y : 0;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    return { x: [minX, maxX], y: [minY, maxY] };
  }

  getGraph() {
    return this.graph;
  }

  getNodeDisplayData(nodeId: string) {
    const attributes = this.graph.getNodeAttributes(nodeId);

    return {
      x: typeof attributes.x === "number" ? attributes.x : 0,
      y: typeof attributes.y === "number" ? attributes.y : 0,
    };
  }

  kill() {}

  on(event: string, handler: (...args: unknown[]) => void) {
    this.handlers[event] = handler;
    return this;
  }
}

export default MockSigma;
