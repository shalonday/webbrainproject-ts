import { Box, Button } from "@mui/material";

interface ActionButtonsProps {
  hasPath: boolean;
  hasSearchResults: boolean;
  isMoveForwardEnabled: boolean;
  isSearchActive: boolean;
  onGeneratePath: () => void;
  onMoveForward: () => void;
  selectedResultId: string | null;
}

/**
 * Action buttons component for search page.
 * Renders Generate Path or Move Forward button based on current state.
 *
 * @param props - Component props.
 * @param props.isSearchActive - Whether a search is currently active.
 * @param props.hasSearchResults - Whether search results exist.
 * @param props.hasPath - Whether a learning path has been generated.
 * @param props.selectedResultId - ID of the selected search result.
 * @param props.isMoveForwardEnabled - Whether the Move Forward action is enabled.
 * @param props.onGeneratePath - Callback to generate a learning path.
 * @param props.onMoveForward - Callback to move forward in the path.
 * @returns The rendered action buttons.
 */
export function ActionButtons({
  isSearchActive,
  hasSearchResults,
  hasPath,
  selectedResultId,
  isMoveForwardEnabled,
  onGeneratePath,
  onMoveForward,
}: ActionButtonsProps) {
  // Generate Path Button
  if (isSearchActive && hasSearchResults && !hasPath) {
    return (
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={!selectedResultId}
          onClick={onGeneratePath}
          sx={{
            borderRadius: 2,
            py: 1.5,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Generate Learning Path
        </Button>
      </Box>
    );
  }

  // Move Forward Button
  if (hasPath) {
    return (
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={!isMoveForwardEnabled}
          onClick={onMoveForward}
          sx={{
            borderRadius: 2,
            py: 1.5,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Move Forward
        </Button>
      </Box>
    );
  }

  return null;
}
