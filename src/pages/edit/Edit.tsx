import { Box, Button, Dialog, DialogTitle } from "@mui/material";
import { type ReactNode, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { AnalyzedSkill, AnalyzeResponse } from "../../types/types";
import EditSigmaGraph from "./EditSigmaGraph";

/**
 * Checks whether a value has the shape of an analyzed skill.
 * Router state is untrusted at runtime, so validate its values before treating
 * them as analyzed skills.
 *
 * @param value - Candidate response value.
 * @returns Whether the value is a valid analyzed skill.
 */
function isAnalyzedSkill(value: unknown): value is AnalyzedSkill {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string" &&
    "uuid" in value &&
    (typeof value.uuid === "string" || value.uuid === null)
  );
}

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
    value.prerequisites.every(isAnalyzedSkill) &&
    "objectives" in value &&
    Array.isArray(value.objectives) &&
    value.objectives.every(isAnalyzedSkill)
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

export interface EditNodeDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 *
 */
function EditNodeDialog(props: EditNodeDialogProps) {
  const { open, onClose } = props;
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>EditNodeDialog</DialogTitle>
    </Dialog>
  );
}

/**
 * Displays prerequisite and objective strings from a URL analysis.
 *
 * @returns The edit page, or a redirect to Search when analysis state is unavailable.
 */
function Edit(): ReactNode {
  const { state } = useLocation();
  const analyzeResponse = getAnalyzeResponse(state);
  console.log(analyzeResponse);
  // TEMP vals for testing
  // const analyzeResponse: AnalyzeResponse = {
  //   url: "https://example.com/lesson",
  //   title: "Example lesson",
  //   content: "Lesson content",
  //   prerequisites: [{ name: "Basic arithmetic", uuid: null }],
  //   objectives: [{ name: "Solve equations", uuid: null }],
  // };

  const [open, setOpen] = useState(false);

  if (!analyzeResponse) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box component="main" sx={{ p: 3 }}>
      <Box component="div" sx={{ p: 3, border: "1px dashed grey" }}>
        Instructions: Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Eos debitis incidunt quam quidem. Atque minima adipisci voluptatum!
        Facere deleniti dicta veniam nemo, consectetur, laborum iste commodi eum
        fugiat quod autem.
      </Box>
      <EditSigmaGraph />
      <EditNodeDialog open={open} onClose={() => setOpen(false)} />
      <Button variant="outlined">Cancel</Button>
      <Button variant="contained">Submit</Button>
    </Box>
  );
}

export default Edit;
