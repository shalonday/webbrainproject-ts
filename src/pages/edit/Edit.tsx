import { Box, Button, Typography } from "@mui/material";
import { type ReactNode, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { AnalyzedSkill, AnalyzeResponse, WBNode } from "../../types/types";
import { createAnalyzeResponseTree } from "./createAnalyzeResponseTree";
import EditSigmaGraph from "./EditSigmaGraph";
import EditSkillDialog from "./EditSkillDialog";

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
    (typeof value.uuid === "string" || value.uuid === null) &&
    (!("assessmentUrls" in value) ||
      value.assessmentUrls == null ||
      (Array.isArray(value.assessmentUrls) &&
        value.assessmentUrls.every((url: unknown) => typeof url === "string")))
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

  return <EditContent analyzeResponse={analyzeResponse} />;
}

/**
 * Owns the editable graph for one analysis.
 *
 * @param props - The analysis to edit.
 * @returns The edit page.
 */
function EditContent({
  analyzeResponse,
}: {
  analyzeResponse: AnalyzeResponse;
}) {
  const [tree, setTree] = useState(() =>
    createAnalyzeResponseTree(analyzeResponse),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = tree.nodes.find((node) => node.uuid === selectedNodeId);
  const isNewSkill = selectedNode?.uuid.startsWith("candidate-skill:") ?? false;

  /**
   * Updates the selected node without changing its ID or links.
   *
   * @param updatedNode - The edited skill.
   */
  function saveSkill(updatedNode: WBNode) {
    setTree((currentTree) => ({
      ...currentTree,
      nodes: currentTree.nodes.map((node) =>
        node.uuid === updatedNode.uuid ? updatedNode : node,
      ),
    }));
    setSelectedNodeId(null);
  }

  return (
    <Box component="main" sx={{ p: 3 }}>
      <Box
        aria-label="Instructions"
        component="section"
        sx={{
          border: "1px dashed grey",
          mb: 2,
          minHeight: 96,
          p: 3,
        }}
      >
        Instructions: Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Eos debitis incidunt quam quidem. Atque minima adipisci voluptatum!
        Facere deleniti dicta veniam nemo, consectetur, laborum iste commodi eum
        fugiat quod autem.
      </Box>
      <Box
        component="section"
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 2fr) minmax(280px, 1fr)",
          },
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <EditSigmaGraph onSkillClick={setSelectedNodeId} tree={tree} />
        </Box>
        <Box
          aria-labelledby="analyzed-content-title"
          component="aside"
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            height: "60vh",
            minHeight: 320,
            overflowY: "auto",
            p: 2,
          }}
        >
          <Typography
            component="h2"
            id="analyzed-content-title"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 1, pb: 1 }}
            variant="h6"
          >
            {analyzeResponse.title}
          </Typography>
          <Typography
            component="p"
            sx={{ m: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
            variant="body2"
          >
            {analyzeResponse.content}
          </Typography>
        </Box>
      </Box>
      {selectedNode && (
        <EditSkillDialog
          isNewSkill={isNewSkill}
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onSave={saveSkill}
        />
      )}
      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
          pt: 2,
        }}
      >
        <Button variant="outlined">Cancel</Button>
        <Button variant="contained">Submit</Button>
      </Box>
    </Box>
  );
}

export default Edit;
