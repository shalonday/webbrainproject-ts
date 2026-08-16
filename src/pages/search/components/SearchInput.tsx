import AddLinkIcon from "@mui/icons-material/AddLink";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import type { KeyboardEvent } from "react";
import { useMemo, useState } from "react";

import { ContentIngestionDialog } from "./ContentIngestionDialog";

interface SearchInputProps {
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  value: string;
}

/**
 *
 */
const looksLikeUrl = (value: string): boolean => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

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
  onSearchSubmit,
}: SearchInputProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isSearchActive = useMemo(() => value.trim().length > 0, [value]);
  const hasPrefilledUrl = useMemo(() => looksLikeUrl(value), [value]);

  return (
    <>
      <Box sx={{ px: 3, pb: 2 }}>
        <TextField
          id="search-textbox"
          placeholder="Search for a skill or URL"
          aria-label="search"
          variant="outlined"
          fullWidth
          value={value}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            const target = event.target as HTMLInputElement | null;
            onSearchSubmit(target?.value ?? "");
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: isSearchActive ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Add URL"
                  color="primary"
                  onClick={() => setIsDialogOpen(true)}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                  }}
                >
                  <AddLinkIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: "grey.100",
            },
          }}
        />
      </Box>

      <ContentIngestionDialog
        key={isDialogOpen ? "ingestion-dialog-open" : "ingestion-dialog-closed"}
        initialUrl={hasPrefilledUrl ? value : ""}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
