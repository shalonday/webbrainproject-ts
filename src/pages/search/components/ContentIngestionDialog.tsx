import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";

interface ContentIngestionDialogProps {
  initialUrl?: string;
  onClose: () => void;
  open: boolean;
}

/**
 * Validates whether the supplied string is a valid http or https URL.
 *
 * @param value - Candidate URL string to validate.
 * @returns True when the value is a valid absolute http or https URL.
 */
const isValidHttpUrl = (value: string): boolean => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Small dialog used to capture a URL for later content ingestion.
 *
 * @param props - Component props.
 * @param props.initialUrl - Optional URL to prefill when the user already typed one.
 * @param props.onClose - Callback when the dialog closes.
 * @param props.open - Whether the dialog is visible.
 * @returns The rendered ingestion dialog.
 */
export function ContentIngestionDialog({
  initialUrl = "",
  onClose,
  open,
}: ContentIngestionDialogProps) {
  const [inputValue, setInputValue] = useState(initialUrl);

  const isValidUrl = useMemo(() => isValidHttpUrl(inputValue), [inputValue]);

  /**
   * Resets the field to the value supplied whenever the dialog is opened.
   */
  const resetInputValue = () => {
    setInputValue(initialUrl);
  };

  /**
   * Closes the dialog and clears any transient local edits.
   */
  const handleClose = () => {
    resetInputValue();
    onClose();
  };

  /**
   * Submits a valid URL once the user confirms the ingestion action.
   */
  const handleSubmit = () => {
    if (!isValidUrl) {
      return;
    }

    resetInputValue();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add URL</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
      >
        <TextField
          autoFocus
          fullWidth
          label="URL"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="https://example.com"
          error={Boolean(inputValue) && !isValidUrl}
          helperText={
            Boolean(inputValue) && !isValidUrl
              ? "Enter a valid http or https URL."
              : "Add a URL to submit it for content ingestion."
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!isValidUrl}
          onClick={handleSubmit}
        >
          Add URL
        </Button>
      </DialogActions>
    </Dialog>
  );
}
