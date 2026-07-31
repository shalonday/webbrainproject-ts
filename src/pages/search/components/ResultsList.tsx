import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import type { WBNode } from "../../../types/types";

interface ResultsListProps {
  onResultSelect: (nodeId: string) => void;
  results: WBNode[];
  searchTerm: string;
  selectedResultId: string | null;
}

/**
 * Search results list component.
 * Displays nodes matching the search term with selection capability.
 *
 * @param props - Component props.
 * @param props.results - Array of nodes matching the search.
 * @param props.selectedResultId - ID of the currently selected result.
 * @param props.onResultSelect - Callback when a result is selected.
 * @param props.searchTerm - The search term used.
 * @returns The rendered results list.
 */
export function ResultsList({
  results,
  selectedResultId,
  onResultSelect,
  searchTerm,
}: ResultsListProps) {
  return (
    <>
      <Typography
        variant="subtitle2"
        sx={{ px: 1, py: 1, color: "text.secondary" }}
      >
        {results.length} result
        {results.length !== 1 ? "s" : ""} found
      </Typography>
      <List>
        {results.map((node) => (
          <ListItem key={node.uuid} disablePadding>
            <ListItemButton
              selected={selectedResultId === node.uuid}
              data-selected={selectedResultId === node.uuid ? "true" : "false"}
              onClick={() => onResultSelect(node.uuid)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemText
                primary={node.name}
                secondary={`Type: ${node.type}`}
                primaryTypographyProps={{
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        {results.length === 0 && (
          <Typography
            variant="body2"
            sx={{ px: 1, py: 2, color: "text.secondary" }}
          >
            No results found for &quot;{searchTerm}&quot;
          </Typography>
        )}
      </List>
    </>
  );
}
