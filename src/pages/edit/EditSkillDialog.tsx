import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@mui/material";
import { useState } from "react";

import type { WBNode } from "../../types/types";

interface EditSkillDialogProps {
  isNewSkill: boolean;
  node: WBNode;
  onClose: () => void;
  onSave: (node: WBNode) => void;
}

/**
 * Returns a validation message for an assessment URL, if any.
 *
 * @param url - The trimmed URL to validate.
 * @param existingUrls - URLs already attached to the skill.
 * @returns A validation message, or null when the URL is valid and new.
 */
function getAssessmentUrlError(
  url: string,
  existingUrls: string[],
): string | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return "Enter a valid HTTP or HTTPS URL.";
    }
  } catch {
    return "Enter a valid HTTP or HTTPS URL.";
  }

  if (existingUrls.includes(url)) {
    return "This assessment URL has already been added.";
  }

  return null;
}

/**
 * Creates the skill node represented by the editor's current draft.
 *
 * @param node - The original skill node.
 * @param isNewSkill - Whether the skill name can be changed.
 * @param name - The edited skill name.
 * @param assessmentUrls - The skill's current assessment URLs.
 * @returns The updated skill node.
 */
function createUpdatedSkillNode(
  node: WBNode,
  isNewSkill: boolean,
  name: string,
  assessmentUrls: string[],
): WBNode {
  return {
    ...node,
    name: isNewSkill ? name.trim() : node.name,
    ...(assessmentUrls.length > 0 ? { assessmentUrls } : {}),
  };
}

/**
 * Edits a skill name and appends assessment URLs.
 *
 * @param props - The selected skill and dialog callbacks.
 * @returns The skill editor dialog.
 */
function EditSkillDialog({
  isNewSkill,
  node,
  onClose,
  onSave,
}: EditSkillDialogProps) {
  const [name, setName] = useState(node.name);
  const [assessmentUrls, setAssessmentUrls] = useState(
    node.assessmentUrls ?? [],
  );
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  /** Validates and appends the pending URL. */
  function addUrl() {
    const trimmedUrl = url.trim();
    const validationError = getAssessmentUrlError(trimmedUrl, assessmentUrls);
    if (validationError) {
      setUrlError(validationError);
      return;
    }

    setAssessmentUrls([...assessmentUrls, trimmedUrl]);
    setUrl("");
    setUrlError("");
  }

  /** Saves the draft skill. */
  function save() {
    onSave(createUpdatedSkillNode(node, isNewSkill, name, assessmentUrls));
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open>
      <DialogTitle>Edit skill</DialogTitle>
      <DialogContent>
        <TextField
          disabled={!isNewSkill}
          fullWidth
          label="Skill name"
          margin="normal"
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        <List aria-label="Assessment URLs" dense>
          {assessmentUrls.map((assessmentUrl) => (
            <ListItem key={assessmentUrl} sx={{ overflowWrap: "anywhere" }}>
              <ListItemText primary={assessmentUrl} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1 }}>
          <TextField
            error={Boolean(urlError)}
            fullWidth
            helperText={urlError}
            label="Assessment URL"
            onChange={(event) => {
              setUrl(event.target.value);
              setUrlError("");
            }}
            type="url"
            value={url}
          />
          <Button onClick={addUrl} sx={{ minHeight: 56 }} variant="outlined">
            Add
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!name.trim() || Boolean(url.trim())}
          onClick={save}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditSkillDialog;
