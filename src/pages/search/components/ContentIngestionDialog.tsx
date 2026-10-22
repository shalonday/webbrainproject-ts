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
  onSubmit?: (url: string) => Promise<void> | void;
  open: boolean;
}

/**
 * Validates whether the supplied string is a valid HTTPS URL.
 *
 * @param value - Candidate URL string to validate.
 * @returns True when the value is a valid absolute HTTPS URL.
 */
const isValidHttpsUrl = (value: string): boolean => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const hasAllowedProtocol = parsedUrl.protocol === "https:";
    const hasHostname = Boolean(parsedUrl.hostname);

    return hasAllowedProtocol && hasHostname;
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
  onSubmit,
  open,
}: ContentIngestionDialogProps) {
  const [inputValue, setInputValue] = useState(initialUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isValidUrl = useMemo(() => isValidHttpsUrl(inputValue), [inputValue]);

  /**
   * Resets the field to the value supplied whenever the dialog is opened.
   */
  const resetInputValue = () => {
    setInputValue(initialUrl);
    setSubmitError("");
    setIsSubmitting(false);
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
  const handleSubmit = async () => {
    if (!isValidUrl) {
      return;
    }

    const trimmedUrl = inputValue.trim();

    try {
      setIsSubmitting(true);
      setSubmitError("");
      await onSubmit?.(trimmedUrl);

      resetInputValue();
      onClose();
    } catch (error) {
      const backendError =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;

      setSubmitError(
        backendError ||
          (error instanceof Error
            ? error.message
            : "Unable to submit this URL right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
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
          onChange={(event) => {
            setInputValue(event.target.value);
            setSubmitError("");
          }}
          placeholder="https://example.com"
          error={Boolean(inputValue) && (!isValidUrl || Boolean(submitError))}
          helperText={
            submitError
              ? submitError
              : Boolean(inputValue) && !isValidUrl
                ? "Enter a valid HTTPS URL."
                : "Add a URL to submit it for content ingestion."
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!isValidUrl || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Adding..." : "Add URL"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
