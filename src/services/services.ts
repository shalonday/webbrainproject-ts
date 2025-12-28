import { BASE_URL } from "../common-constants";
import type { Tree } from "../types/types";

/**
 * Fetches the universal tree data from the API.
 * This function retrieves the complete graph structure containing skills and URLs
 * with their prerequisite and teaching relationships.
 *
 * @returns {Promise<Tree>} A promise that resolves to the universal tree data.
 * @throws {Error} Throws an error if the network request fails or the response is invalid.
 */
export async function fetchUniversalTree(): Promise<Tree> {
  try {
    const res = await fetch(`${BASE_URL}/tree`);
    const data = await res.json();
    return data;
  } catch {
    throw new Error("There was an error fetching the universal tree");
  }
}
