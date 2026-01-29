import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, TextField } from "@mui/material";

interface SearchInputProps {
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onSearchChange: (value: string) => void;
  value: string;
}

/**
 * Search input field component.
 * Renders a text field with search icon for querying skills and URLs.
 *
 * @param props - Component props.
 * @param props.value - Current search term.
 * @param props.onSearchChange - Callback when search term changes.
 * @param props.onKeyDown - Callback for keyboard events (e.g., Enter to confirm).
 * @returns The rendered search input.
 */
export function SearchInput({
  value,
  onSearchChange,
  onKeyDown,
}: SearchInputProps) {
  return (
    <Box sx={{ px: 3, pb: 2 }}>
      <TextField
        id="search-textbox"
        placeholder="Search for a skill or URL"
        aria-label="search"
        variant="outlined"
        fullWidth
        value={value}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={onKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            backgroundColor: "grey.100",
          },
        }}
      />
    </Box>
  );
}
