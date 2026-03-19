import { Alert, Box, Button, Link, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { isAllowedExternalUrl } from "./registry";

interface SkillTestExternalRedirectProps {
  externalUrl: string;
  title: string;
}

/**
 * Transition screen that auto-redirects to an external skill practice URL.
 * Falls back to a manual link button and shows an error for invalid URLs.
 *
 * @param props - Component props.
 * @param props.title - Display name of the skill.
 * @param props.externalUrl - The external URL to redirect to.
 * @returns The rendered redirect transition screen.
 */
export function SkillTestExternalRedirect({
  externalUrl,
  title,
}: SkillTestExternalRedirectProps): ReactNode {
  const urlValid = isAllowedExternalUrl(externalUrl);

  useEffect(() => {
    if (urlValid) {
      window.location.assign(externalUrl);
    }
  }, [externalUrl, urlValid]);

  if (!urlValid) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 2, justifyContent: "center" }}>
          The configured practice URL is invalid or not allowed.
        </Alert>
        <Typography variant="body1">
          Skill: <strong>{title}</strong>
        </Typography>
        <Button href="/" sx={{ mt: 2 }}>
          Back to Search
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Redirecting you to practice...
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Skill: <strong>{title}</strong>
      </Typography>
      <Button
        variant="contained"
        component={Link}
        href={externalUrl}
        rel="noopener noreferrer"
      >
        Open practice link
      </Button>
    </Box>
  );
}
