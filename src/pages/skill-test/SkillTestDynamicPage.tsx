import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";

import type { InternalDynamicSkillTestConfig } from "./types";

interface SkillTestDynamicPageProps {
  config: InternalDynamicSkillTestConfig;
}

/**
 * Internal skill test page rendered from local configuration.
 * Provides a self-check flow with a completion action.
 *
 * @param props - Component props.
 * @param props.config - The internal dynamic skill test configuration.
 * @returns The rendered dynamic skill test page.
 */
export function SkillTestDynamicPage({
  config,
}: SkillTestDynamicPageProps): ReactNode {
  const [selfChecked, setSelfChecked] = useState(false);
  const [completed, setCompleted] = useState(false);

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {config.title}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Review the skill below and confirm when you feel confident.
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={selfChecked}
            onChange={(e) => setSelfChecked(e.target.checked)}
          />
        }
        label="I have practiced this skill and feel confident"
      />

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          disabled={!selfChecked || completed}
          onClick={() => setCompleted(true)}
        >
          Done
        </Button>
        <Button href="/">Back to Search</Button>
      </Box>

      {completed && (
        <Typography variant="body2" sx={{ mt: 2, color: "success.main" }}>
          Skill test completed. You can close this tab.
        </Typography>
      )}
    </Box>
  );
}
