import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import type { WBNode } from "../../../types/types";

interface RecommendedListProps {
  recommendedNodes: WBNode[];
}

/**
 * Recommended skills list component.
 * Displays a list of suggested nodes when no search is active.
 *
 * @param props - Component props.
 * @param props.recommendedNodes - Array of recommended nodes to display.
 * @returns The rendered recommended list.
 */
export function RecommendedList({ recommendedNodes }: RecommendedListProps) {
  return (
    <>
      <Typography
        variant="subtitle2"
        sx={{ px: 1, py: 1, color: "text.secondary" }}
      >
        Recommended Skills
      </Typography>
      <List>
        {recommendedNodes.map((node) => (
          <ListItem key={node.id} disablePadding>
            <ListItemButton
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
        {recommendedNodes.length === 0 && (
          <Typography
            variant="body2"
            sx={{ px: 1, py: 2, color: "text.secondary" }}
          >
            No recommendations available
          </Typography>
        )}
      </List>
    </>
  );
}
