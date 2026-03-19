import { Box, Button, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface SkillTestNotConfiguredProps {
  nodeId: string;
}

/**
 * Fallback page shown when a skill test is not yet configured for the given node ID.
 *
 * @param props - Component props.
 * @param props.nodeId - The unrecognised skill node UUID.
 * @returns The rendered not-configured fallback page.
 */
export function SkillTestNotConfigured({
  nodeId,
}: SkillTestNotConfiguredProps): ReactNode {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Skill test not configured
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        There is no skill test set up for this node yet.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Node ID: {nodeId}
      </Typography>
      <Button variant="contained" href="/">
        Back to Search
      </Button>
    </Box>
  );
}
