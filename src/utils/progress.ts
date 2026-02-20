/**
 * Progress helpers for WBP Chatbot.
 *
 * Provides a thin client helper to compute the preferred start node by
 * delegating to the backend `POST /progress/start-node`. If the backend is
 * unavailable, a local fallback algorithm accepts a successors map and
 * computes terminal completed nodes.
 */

export type SuccessorsMap = Record<string, string[]>;

export type StartNodeResponse = {
  terminals: string[];
  startNodeId: string | null;
};

/**
 * Call the backend to compute terminal completed skills and a start node.
 */
export async function computeStartNodeRemote(
  doneIds: string[],
  targetId?: string,
  baseUrl = "",
): Promise<StartNodeResponse> {
  const resp = await fetch(`${baseUrl}/progress/start-node`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doneIds, targetId }),
  });
  if (!resp.ok) {
    throw new Error(`Server responded ${resp.status}`);
  }
  return resp.json();
}

/**
 * Local fallback: given user's completed `doneIds` and a `successors` map,
 * return terminal completed nodes (those that do not reach another completed node).
 */
export function terminalCompletedNodes(
  doneIds: string[],
  successors: SuccessorsMap,
): string[] {
  const doneSet = new Set(doneIds);
  const memo = new Map<string, boolean>();

  /**
   *
   */
  function isAncestorOfAnyDone(node: string): boolean {
    if (memo.has(node)) return memo.get(node)!;
    const stack = [...(successors[node] || [])];
    const visited = new Set<string>();
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      if (doneSet.has(cur)) {
        memo.set(node, true);
        return true;
      }
      stack.push(...(successors[cur] || []));
    }
    memo.set(node, false);
    return false;
  }

  return doneIds.filter((id) => !isAncestorOfAnyDone(id));
}

/**
 * Pick the most advanced node from terminals by reachable-descendant count.
 */
export function pickMostAdvanced(
  terminals: string[],
  successors: SuccessorsMap,
): string | null {
  if (terminals.length === 0) return null;
  const descMemo = new Map<string, number>();
  /**
   *
   */
  function descCount(node: string): number {
    if (descMemo.has(node)) return descMemo.get(node)!;
    let count = 0;
    for (const s of successors[node] || []) {
      count += 1 + descCount(s);
    }
    descMemo.set(node, count);
    return count;
  }
  let best = terminals[0];
  for (const t of terminals) {
    if (descCount(t) > descCount(best)) best = t;
  }
  return best;
}

export default {
  computeStartNodeRemote,
  terminalCompletedNodes,
  pickMostAdvanced,
};
