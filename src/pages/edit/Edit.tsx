import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { AnalyzeResponse } from "../../types/types";

/**
 * Checks whether a value has the response shape returned by the analyze endpoint.
 *
 * @param value - Candidate route-state value.
 * @returns Whether the value is a valid analyze response.
 */
function isAnalyzeResponse(value: unknown): value is AnalyzeResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "url" in value &&
    typeof value.url === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "content" in value &&
    typeof value.content === "string" &&
    "prerequisites" in value &&
    Array.isArray(value.prerequisites) &&
    value.prerequisites.every(
      (prerequisite: unknown) => typeof prerequisite === "string",
    ) &&
    "objectives" in value &&
    Array.isArray(value.objectives) &&
    value.objectives.every((objective: unknown) => typeof objective === "string")
  );
}

/**
 * Reads a valid analyze response from router state.
 *
 * @param state - The current route state.
 * @returns The analyze response, or undefined when route state is missing or invalid.
 */
function getAnalyzeResponse(state: unknown): AnalyzeResponse | undefined {
  if (
    typeof state !== "object" ||
    state === null ||
    !("analyzeResponse" in state) ||
    !isAnalyzeResponse(state.analyzeResponse)
  ) {
    return undefined;
  }

  return state.analyzeResponse;
}

/**
 * Displays prerequisite and objective strings from a URL analysis.
 *
 * @returns The edit page, or a redirect to Search when analysis state is unavailable.
 */
function Edit(): ReactNode {
  const { state } = useLocation();
  const analyzeResponse = getAnalyzeResponse(state);

  if (!analyzeResponse) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box component="main" sx={{ p: 3 }}>
      <Typography component="h1" variant="h4">
        Edit content
      </Typography>
      <Typography component="h2" variant="h6" sx={{ mt: 3 }}>
        Prerequisites
      </Typography>
      <List dense>
        {analyzeResponse.prerequisites.map((prerequisite, index) => (
          <ListItem key={`${prerequisite}-${index}`}>
            <ListItemText primary={prerequisite} />
          </ListItem>
        ))}
      </List>
      <Typography component="h2" variant="h6" sx={{ mt: 2 }}>
        Objectives
      </Typography>
      <List dense>
        {analyzeResponse.objectives.map((objective, index) => (
          <ListItem key={`${objective}-${index}`}>
            <ListItemText primary={objective} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Edit;
