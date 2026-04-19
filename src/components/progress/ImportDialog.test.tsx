import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProgressPayload } from "../../types/types";
import { saveLocalProgress } from "../../utils/progressStorage";
import { ImportDialog } from "./ImportDialog";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Build a minimal valid payload, optionally overriding fields.
 */
function makePayload(overrides?: Partial<ProgressPayload>): ProgressPayload {
  return {
    schemaVersion: "1",
    lastUpdated: "2026-01-01T00:00:00Z",
    doneNodeTimestamps: {},
    doneLinkTimestamps: {},
    markedForStudyNodeIds: [],
    ...overrides,
  };
}

afterEach(() => {
  localStorage.clear();
});

// ========================================================================
// Gating
// ========================================================================

describe("ImportDialog — gating", () => {
  it("disables the FAB when a path is active", () => {
    render(<ImportDialog isPathActive={true} onImportSuccess={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Import progress" }),
    ).toBeDisabled();
  });

  it("enables the FAB when no path is active", () => {
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Import progress" }),
    ).not.toBeDisabled();
  });
});

// ========================================================================
// Dialog basics
// ========================================================================

describe("ImportDialog — dialog", () => {
  it("opens on FAB click", async () => {
    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    expect(screen.getByText("Import Progress")).toBeInTheDocument();
    expect(screen.getByLabelText("Select progress file")).toBeInTheDocument();
  });

  it("closes on Cancel click", async () => {
    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));
    expect(screen.getByText("Import Progress")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByText("Import Progress")).not.toBeInTheDocument();
    });
  });
});

// ========================================================================
// Validation
// ========================================================================

describe("ImportDialog — validation", () => {
  it("shows error for non-JSON file", async () => {
    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    const input = screen.getByLabelText("Select progress file");
    const badFile = new File(["not json{{{"], "bad.json", {
      type: "application/json",
    });
    await user.upload(input, badFile);

    await waitFor(() => {
      expect(screen.getByText("File is not valid JSON.")).toBeInTheDocument();
    });
  });

  it("shows validation errors for invalid schema", async () => {
    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    const input = screen.getByLabelText("Select progress file");
    const invalidFile = new File([JSON.stringify({ bad: true })], "bad.json", {
      type: "application/json",
    });
    await user.upload(input, invalidFile);

    await waitFor(() => {
      expect(screen.getAllByText(/Missing or invalid/).length).toBeGreaterThan(
        0,
      );
    });
  });

  it("keeps Import button disabled when file is invalid", async () => {
    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    const input = screen.getByLabelText("Select progress file");
    await user.upload(
      input,
      new File(["not json"], "bad.json", { type: "application/json" }),
    );

    await waitFor(() => {
      expect(screen.getByText("File is not valid JSON.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });
});

// ========================================================================
// No local progress — direct import
// ========================================================================

describe("ImportDialog — no local progress", () => {
  it("imports directly without strategy selection", async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    const payload = makePayload({
      doneNodeTimestamps: { n1: "2026-01-01T00:00:00Z" },
    });
    const input = screen.getByLabelText("Select progress file");
    await user.upload(
      input,
      new File([JSON.stringify(payload)], "progress.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Import" })).not.toBeDisabled();
    });

    // No strategy section visible
    expect(screen.queryByText("Import Strategy")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(
        screen.getByText("Progress imported successfully."),
      ).toBeInTheDocument();
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});

// ========================================================================
// Local progress exists — strategy selection
// ========================================================================

describe("ImportDialog — strategy selection", () => {
  it("shows strategy controls when local progress exists", async () => {
    saveLocalProgress(makePayload());

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    const valid = makePayload({
      doneNodeTimestamps: { n2: "2026-02-01T00:00:00Z" },
    });
    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(valid)], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });
  });

  it("disables Merge and Replace until ownership is confirmed", async () => {
    saveLocalProgress(makePayload());

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(makePayload())], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Merge/)).toBeDisabled();
    expect(screen.getByLabelText(/Replace/)).toBeDisabled();
    expect(screen.getByLabelText(/Study-Diff/)).not.toBeDisabled();
  });

  it("enables Merge and Replace after checking ownership", async () => {
    saveLocalProgress(makePayload());

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(makePayload())], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    await user.click(
      screen.getByLabelText("I own the progress saved in this file"),
    );

    expect(screen.getByLabelText(/Merge/)).not.toBeDisabled();
    expect(screen.getByLabelText(/Replace/)).not.toBeDisabled();
  });

  it("clears Merge selection when ownership is unchecked", async () => {
    saveLocalProgress(makePayload());

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(makePayload())], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    // Check ownership, select Merge, then uncheck
    await user.click(
      screen.getByLabelText("I own the progress saved in this file"),
    );
    await user.click(screen.getByLabelText(/Merge/));
    expect(screen.getByLabelText(/Merge/)).toBeChecked();

    await user.click(
      screen.getByLabelText("I own the progress saved in this file"),
    );

    // Import should be disabled because strategy was cleared
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });

  it("clears Replace selection when ownership is unchecked", async () => {
    saveLocalProgress(makePayload());

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(makePayload())], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    // Check ownership, select Replace, then uncheck
    await user.click(
      screen.getByLabelText("I own the progress saved in this file"),
    );
    await user.click(screen.getByLabelText(/Replace/));
    expect(screen.getByLabelText(/Replace/)).toBeChecked();

    await user.click(
      screen.getByLabelText("I own the progress saved in this file"),
    );

    // Import should be disabled because strategy was cleared
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });
});

// ========================================================================
// Successful import with Study-Diff
// ========================================================================

describe("ImportDialog — successful import", () => {
  it("shows success message and calls onImportSuccess with Study-Diff", async () => {
    saveLocalProgress(makePayload());
    const onSuccess = vi.fn();

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    const imported = makePayload({
      doneNodeTimestamps: { n1: "2026-01-01T00:00:00Z" },
    });
    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(imported)], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/Study-Diff/));
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(
        screen.getByText("Progress imported successfully."),
      ).toBeInTheDocument();
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("shows success with Merge strategy after ownership confirmation", async () => {
    saveLocalProgress(makePayload());
    const onSuccess = vi.fn();

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(makePayload())], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    await user.click(
      screen.getByLabelText("I own the progress saved in this file"),
    );
    await user.click(screen.getByLabelText(/Merge/));
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(
        screen.getByText("Progress imported successfully."),
      ).toBeInTheDocument();
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("shows success with Replace strategy after ownership confirmation", async () => {
    saveLocalProgress(makePayload());
    const onSuccess = vi.fn();

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(makePayload())], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    await user.click(
      screen.getByLabelText("I own the progress saved in this file"),
    );
    await user.click(screen.getByLabelText(/Replace/));
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(
        screen.getByText("Progress imported successfully."),
      ).toBeInTheDocument();
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});

// ========================================================================
// Import failure — localStorage write error
// ========================================================================

describe("ImportDialog — localStorage write failure", () => {
  it("shows error when localStorage save fails during import", async () => {
    saveLocalProgress(makePayload());
    const onSuccess = vi.fn();

    const user = userEvent.setup();
    render(<ImportDialog isPathActive={false} onImportSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: "Import progress" }));

    const imported = makePayload({
      doneNodeTimestamps: { n1: "2026-01-01T00:00:00Z" },
    });
    await user.upload(
      screen.getByLabelText("Select progress file"),
      new File([JSON.stringify(imported)], "p.json", {
        type: "application/json",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Import Strategy")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/Study-Diff/));

    // Simulate quota error on the import write
    const original = localStorage.setItem;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    /**
     *
     */
    localStorage.setItem = () => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    };

    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to persist to localStorage/),
      ).toBeInTheDocument();
    });

    localStorage.setItem = original;
    warnSpy.mockRestore();

    // onImportSuccess should NOT have been called
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
