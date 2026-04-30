import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Fab, Tooltip } from "@mui/material";

import { exportProgress } from "../../../utils/progressStorage";

/**
 * Triggers a browser file download for the given JSON string.
 *
 * @param json - Serialized progress JSON to download.
 */
function triggerDownload(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "webbrain-progress.json";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Floating action button that exports the current local progress as a JSON
 * file download. Always available in both path and non-path views.
 *
 * @returns The rendered export FAB.
 */
export function ExportButton() {
  /**
   * Handles export button click by reading progress and triggering download.
   */
  const handleExport = () => {
    const json = exportProgress();
    if (json) {
      triggerDownload(json);
    }
  };

  return (
    <Tooltip title="Export progress">
      <Fab aria-label="Export progress" onClick={handleExport} size="medium">
        <FileDownloadIcon />
      </Fab>
    </Tooltip>
  );
}
