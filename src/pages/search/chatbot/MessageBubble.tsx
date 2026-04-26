import { Box, Link as MuiLink, Paper } from "@mui/material";

import type { ChatMessage } from "../../../types/types";
import { parseMarkdownLinks } from "./helpers";

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Renders a single chat message bubble with markdown link support
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 1,
      }}
    >
      <Paper
        sx={{
          maxWidth: "70%",
          padding: 2,
          backgroundColor: isUser ? "#1976d2" : "#e0e0e0",
          color: isUser ? "#fff" : "#000",
          borderRadius: 2,
          wordBreak: "break-word",
        }}
      >
        <Box sx={{ whiteSpace: "pre-wrap" }}>
          {message.content.split("\n").map((line, idx) => {
            const parts = parseMarkdownLinks(line);

            return (
              <div key={idx}>
                {parts.map((part, partIdx) => {
                  if (typeof part === "string") {
                    return part;
                  }
                  return (
                    <MuiLink
                      key={partIdx}
                      href={part.url}
                      sx={{
                        color: isUser ? "#fff" : "#1976d2",
                        fontWeight: "bold",
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {part.text}
                    </MuiLink>
                  );
                })}
              </div>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
