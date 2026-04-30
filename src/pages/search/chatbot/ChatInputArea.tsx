import SendIcon from "@mui/icons-material/Send";
import { IconButton, Paper, Stack, TextField } from "@mui/material";

interface ChatInputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

/**
 * Chat input area with message field and send button
 */
export function ChatInputArea({
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
}: ChatInputAreaProps) {
  /**
   *
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <Paper elevation={2} sx={{ padding: 2, borderRadius: 0 }}>
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Ask about learning materials..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Message input"
        />
        <IconButton
          onClick={onSendMessage}
          disabled={isLoading || !inputValue.trim()}
          color="primary"
          aria-label="send message"
        >
          <SendIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
}
