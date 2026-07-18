import { UMAP } from "umap-js";

interface ForceLayoutNode {
  name?: string;
  uuid: string;
  type?: string;
  embedding?: number[];
}

const POSITION_SPREAD_FACTOR = 3000;

/**
 * Creates a deterministic pseudo-random number generator from a numeric seed.
 *
 * @param seed - Seed value used to initialize the generator state.
 * @returns A repeatable random number generator that yields values in the range [0, 1).
 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Computes a stable hash for a set of nodes and their embeddings.
 *
 * @param nodes - The nodes to include in the layout seed.
 * @returns A 32-bit unsigned hash suitable for seeding deterministic layout output.
 */
function hashLayoutSeed(nodes: ForceLayoutNode[]): number {
  let hash = 2166136261;

  for (const node of nodes) {
    for (let index = 0; index < node.uuid.length; index += 1) {
      hash ^= node.uuid.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    for (const value of node.embedding ?? []) {
      const normalized = Number.isFinite(value) ? value : 0;
      const text = normalized.toFixed(6);

      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
    }
  }

  return hash >>> 0;
}

/**
 * Checks whether every node has a finite embedding vector that can be projected.
 *
 * @param nodes - The nodes to validate.
 * @returns True when all nodes contain at least one finite embedding value.
 */
function hasUsableEmbeddings(nodes: ForceLayoutNode[]): boolean {
  return (
    nodes.length > 0 &&
    nodes.every(
      (node) =>
        Array.isArray(node.embedding) &&
        node.embedding.length > 0 &&
        node.embedding.every((value) => Number.isFinite(value)),
    )
  );
}

/**
 * Projects node embeddings into 2D Sigma positions using deterministic UMAP.
 *
 * @param nodes - The nodes whose embeddings will be projected.
 * @returns A map from node UUIDs to normalized 2D coordinates.
 */
function projectEmbeddingsWithUmap(
  nodes: ForceLayoutNode[],
): Record<string, { x: number; y: number }> {
  // These branches provide deterministic, trivial layouts that avoid running a full force algorithm for tiny graphs (1 or 2 nodes)
  // and guarantee visually sensible starting positions.
  if (nodes.length === 1) {
    return {
      [nodes[0].uuid]: scalePosition({ x: 0, y: 0 }),
    };
  }

  if (nodes.length === 2) {
    return {
      [nodes[0].uuid]: scalePosition({ x: -45, y: 0 }),
      [nodes[1].uuid]: scalePosition({ x: 45, y: 0 }),
    };
  }

  const embeddings = nodes.map((node) => node.embedding ?? []);
  const umap = new UMAP({
    nComponents: 2,
    nEpochs: Math.max(50, Math.min(200, nodes.length * 8)),
    nNeighbors: Math.max(2, Math.min(15, nodes.length - 1)),
    random: createSeededRandom(hashLayoutSeed(nodes)),
  });
  const projected = umap.fit(embeddings) as number[][];

  if (!Array.isArray(projected) || projected.length !== nodes.length) {
    throw new Error("UMAP projection did not return one position per node");
  }

  const centroid = projected.reduce(
    (accumulator, position) => {
      const [x = 0, y = 0] = position ?? [];

      return {
        x: accumulator.x + x,
        y: accumulator.y + y,
      };
    },
    { x: 0, y: 0 },
  );
  const centeredCentroid = {
    x: centroid.x / nodes.length,
    y: centroid.y / nodes.length,
  };

  const output: Record<string, { x: number; y: number }> = {};

  for (const [index, node] of nodes.entries()) {
    const [x = 0, y = 0] = projected[index] ?? [];
    const centeredX = x - centeredCentroid.x;
    const centeredY = y - centeredCentroid.y;
    const length = Math.hypot(centeredX, centeredY);
    const maxLength = 110;
    const scale = length > maxLength && length > 0 ? maxLength / length : 1;

    output[node.uuid] = scalePosition({
      x: centeredX * scale,
      y: centeredY * scale,
    });
  }

  return output;
}

/**
 * Applies a global spread factor to a Sigma layout position.
 *
 * @param position - The centered layout position to scale outward.
 * @returns The scaled position with a larger node-to-node spacing.
 */
function scalePosition(position: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: Number((position.x * POSITION_SPREAD_FACTOR).toFixed(3)),
    y: Number((position.y * POSITION_SPREAD_FACTOR).toFixed(3)),
  };
}

/**
 * Build stable 2D positions for the Sigma graph.
 *
 * Requires embeddings on every node and projects them with deterministic UMAP.
 * Throws if the graph data is incomplete so missing embeddings are surfaced early.
 */
export function buildDeterministicForceLayoutPositions(
  nodes: ForceLayoutNode[],
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) {
    return {};
  }

  if (!hasUsableEmbeddings(nodes)) {
    throw new Error("Sigma layout requires embeddings on every node");
  }

  return projectEmbeddingsWithUmap(nodes);
}
