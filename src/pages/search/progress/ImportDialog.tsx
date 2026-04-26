import FileUploadIcon from "@mui/icons-material/FileUpload";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ChangeEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

import type { ImportStrategy } from "../../../types/types";
import {
  getLocalProgress,
  importProgressFromFile,
  validateProgressPayload,
} from "../../../utils/progressStorage";

interface ImportDialogProps {
  isPathActive: boolean;
  onImportSuccess: () => void;
}

/**
 * Import progress button and dialog. Renders a FAB that opens an import
 * dialog with file selection, validation, strategy choice, and ownership
 * confirmation. Gated: the FAB is disabled when a path is active.
 *
 * @param props - Component props.
 * @param props.isPathActive - Whether a learning path is currently active.
 * @param props.onImportSuccess - Callback invoked after a successful import.
 * @returns The rendered import FAB and dialog.
 */
export function ImportDialog({
  isPathActive,
  onImportSuccess,
}: ImportDialogProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFileValid, setIsFileValid] = useState(false);
  const [hasLocalProgress, setHasLocalProgress] = useState(false);
  const [strategy, setStrategy] = useState<ImportStrategy | null>(null);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setValidationErrors([]);
    setIsFileValid(false);
    setHasLocalProgress(false);
    setStrategy(null);
    setOwnershipConfirmed(false);
    setResultMessage(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  /**
   * Opens the import dialog and resets internal state.
   */
  const handleOpen = () => {
    resetState();
    setHasLocalProgress(getLocalProgress() !== null);
    setOpen(true);
  };

  /**
   * Closes the import dialog.
   */
  const handleClose = () => {
    setOpen(false);
  };

  /**
   * Reads, parses, and validates the selected file, updating dialog state.
   */
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setResultMessage(null);
    setStrategy(null);
    setOwnershipConfirmed(false);

    let text: string;
    try {
      text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string); // eslint-disable-line jsdoc/require-jsdoc
        reader.onerror = () => reject(reader.error); // eslint-disable-line jsdoc/require-jsdoc
        reader.readAsText(file);
      });
    } catch {
      setValidationErrors(["Failed to read the file."]);
      setIsFileValid(false);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setValidationErrors(["File is not valid JSON."]);
      setIsFileValid(false);
      return;
    }

    const validation = validateProgressPayload(parsed);
    if (!validation.ok) {
      setValidationErrors(validation.errors ?? []);
      setIsFileValid(false);
      return;
    }

    setValidationErrors([]);
    setIsFileValid(true);
    setHasLocalProgress(getLocalProgress() !== null);
  };

  /**
   * Applies the selected import strategy and updates the result message.
   */
  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setResultMessage(null);

    const importStrategy: ImportStrategy =
      hasLocalProgress && strategy ? strategy : "Merge";

    // the import function attempts to change the saved progress, but doesn't change the UI display directly
    const result = await importProgressFromFile(selectedFile, importStrategy);

    setIsImporting(false);

    if (result.success) {
      setResultMessage({
        type: "success",
        text: "Progress imported successfully.",
      });

      // highlighting the imported progress is handled by this (or more specifically, the refreshFromStorage callback)
      onImportSuccess();
    } else {
      setResultMessage({
        type: "error",
        text: result.errors?.join(" ") ?? "Import failed.",
      });
    }
  };

  /**
   * Toggles ownership confirmation and clears Merge/Replace if unchecked.
   */
  const handleOwnershipChange = (
    _event: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setOwnershipConfirmed(checked);
    if (!checked && (strategy === "Merge" || strategy === "Replace")) {
      setStrategy(null);
    }
  };

  const hasSelectedStrategyThatIsAllowed =
    strategy !== null && (strategy === "Study-Diff" || ownershipConfirmed);

  const isImportEnabled =
    isFileValid &&
    !isImporting &&
    (!hasLocalProgress || hasSelectedStrategyThatIsAllowed);

  return (
    <>
      <Tooltip
        title={
          isPathActive
            ? "Import disabled during active path"
            : "Import progress"
        }
      >
        <span>
          <Fab
            aria-label="Import progress"
            disabled={isPathActive}
            onClick={handleOpen}
            size="medium"
          >
            <FileUploadIcon />
          </Fab>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Import Progress</DialogTitle>
        <DialogContent>
          <input
            ref={fileInputRef}
            accept=".json"
            aria-label="Select progress file"
            onChange={handleFileChange}
            style={{ marginTop: 8 }}
            type="file"
          />

          {selectedFile && validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validationErrors.map((err) => (
                <Typography key={err} variant="body2">
                  {err}
                </Typography>
              ))}
            </Alert>
          )}

          {isFileValid && hasLocalProgress && (
            <>
              <FormControl
                component="fieldset"
                sx={{ mt: 2, display: "block" }}
              >
                <FormLabel component="legend">Import Strategy</FormLabel>
                <RadioGroup
                  value={strategy ?? ""}
                  onChange={(e) =>
                    setStrategy(e.target.value as ImportStrategy)
                  }
                >
                  <FormControlLabel
                    control={<Radio />}
                    disabled={!ownershipConfirmed}
                    label="Merge — combine local and imported progress"
                    value="Merge"
                  />
                  <FormControlLabel
                    control={<Radio />}
                    disabled={!ownershipConfirmed}
                    label="Replace — overwrite local with imported progress"
                    value="Replace"
                  />
                  <FormControlLabel
                    control={<Radio />}
                    label="Study-Diff — mark imported-only items for study"
                    value="Study-Diff"
                  />
                </RadioGroup>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={ownershipConfirmed}
                    onChange={handleOwnershipChange}
                  />
                }
                label="I own the progress saved in this file"
                sx={{ mt: 1, display: "block" }}
              />
            </>
          )}

          {resultMessage && (
            <Alert severity={resultMessage.type} sx={{ mt: 2 }}>
              {resultMessage.text}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!isImportEnabled}
            onClick={handleImport}
            variant="contained"
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
