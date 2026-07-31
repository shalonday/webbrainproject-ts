import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import type { WBNode } from "../../../types/types";

interface PathListProps {
  currentNodeId: string | null;
  doneNodeIds: string[];
  onPathNodeClick: (node: WBNode) => void;
  pathNodes: WBNode[];
}

/**
 * Learning path list component.
 * Displays the generated learning path with current and done indicators.
 *
 * @param props - Component props.
 * @param props.pathNodes - Array of nodes in the learning path.
 * @param props.currentNodeId - ID of the current node in traversal.
 * @param props.doneNodeIds - Array of completed node IDs.
 * @param props.onPathNodeClick - Callback when a path node is clicked.
 * @returns The rendered path list.
 */
export function PathList({
  pathNodes,
  currentNodeId,
  doneNodeIds,
  onPathNodeClick,
}: PathListProps) {
  return (
    <>
      <Typography
        variant="subtitle2"
        sx={{ px: 1, py: 1, color: "text.secondary" }}
      >
        Learning Path
      </Typography>
      <List>
        {pathNodes.map((node) => {
          const isCurrent = currentNodeId === node.uuid;
          const isDone = doneNodeIds.includes(node.uuid);
          const statusLabels = [
            isDone ? "Done" : null,
            isCurrent ? "Current" : null,
          ].filter(Boolean) as string[];

          return (
            <ListItem key={node.uuid} disablePadding>
              <ListItemButton
                aria-current={isCurrent ? "step" : undefined}
                data-current={isCurrent ? "true" : "false"}
                data-dimmed={isCurrent ? "false" : "true"}
                data-done={isDone ? "true" : "false"}
                data-node-id={node.uuid}
                onClick={() => onPathNodeClick(node)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isCurrent ? "primary.light" : "transparent",
                  opacity: isCurrent ? 1 : isDone ? 0.8 : 0.6,
                  "&:hover": {
                    backgroundColor: isCurrent
                      ? "primary.light"
                      : "action.hover",
                  },
                }}
              >
                <ListItemText
                  primary={node.name}
                  secondary={`Type: ${node.type}${statusLabels.length > 0 ? ` • ${statusLabels.join(" • ")}` : ""}`}
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );
}
