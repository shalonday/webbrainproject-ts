import { useQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";

import { BASE_URL } from "../common-constants";
import type { Tree } from "../types/types";

export interface SkillTreesContextValue {
  errorQuery: Error | null;
  isLoadingQuery: boolean;
  universalTree: Tree | undefined;
}

const SkillTreesContext = createContext<SkillTreesContextValue | undefined>(
  undefined
);

/**
 * Context provider that manages all skill tree data and operations.
 * Wraps components to provide centralized access to:
 * - Universal tree data (all nodes and links)
 * - Search results (filtered by text query)
 * - Path results (learning path between two nodes)
 * - Mutations for merging and updating trees
 *
 * Uses React Query for server state management with automatic caching,
 * background refetching, and optimistic updates.
 *
 * @param props - Component props.
 * @param props.children - Child components that will have access to the context.
 * @returns Provider component wrapping children with SkillTreesContext.
 */
function SkillTreesContextProvider({ children }: PropsWithChildren) {
  // const queryClient = useQueryClient();

  // Universal tree query
  const {
    isLoading: isLoadingQuery,
    data: universalTree,
    error: errorQuery,
  } = useQuery<Tree>({
    queryFn: fetchUniversalTree,
    queryKey: ["universalTree"],
  });

  /**
   * Fetches the universal tree data from the backend API.
   * Retrieves the complete graph of all nodes and links.
   *
   * @returns A promise that resolves to the universal tree data.
   * @throws If the API request fails or returns a non-OK response.
   */
  async function fetchUniversalTree(): Promise<Tree> {
    const res = await fetch(`${BASE_URL}/tree`);
    if (!res.ok) {
      throw new Error("There was an error fetching the universal tree");
    }
    return res.json();
  }

  return (
    <SkillTreesContext.Provider
      value={{
        errorQuery,
        isLoadingQuery,
        universalTree,
      }}
    >
      {children}
    </SkillTreesContext.Provider>
  );
}

/**
 * Hook to access the SkillTreesContext.
 * Allows components to access the context object provided by SkillTreesContextProvider,
 * which contains the universal tree data, loading states, and error information.
 *
 * @returns The context object containing universalTree, isLoadingQuery, and errorQuery.
 * @throws If used outside of SkillTreesContextProvider.
 */
function useSkillTreesContext(): SkillTreesContextValue {
  const context = useContext(SkillTreesContext);
  if (context === undefined) {
    throw new Error(
      "SkillTreesContext is being used outside of SkillTreesContextProvider"
    );
  }
  return context;
}

/* eslint-disable react-refresh/only-export-components */
export { SkillTreesContextProvider, useSkillTreesContext };
