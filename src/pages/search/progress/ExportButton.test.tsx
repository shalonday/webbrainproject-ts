import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveLocalProgress } from "../../../utils/progressStorage";
import { ExportButton } from "./ExportButton";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let originalCreateObjectURL: typeof URL.createObjectURL;
let originalRevokeObjectURL: typeof URL.revokeObjectURL;

beforeEach(() => {
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  localStorage.clear();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ExportButton", () => {
  it("renders a FAB with 'Export progress' label", () => {
    render(<ExportButton />);
    expect(screen.getByLabelText("Export progress")).toBeInTheDocument();
  });

  it("triggers a file download when progress exists", async () => {
    saveLocalProgress({
      schemaVersion: "1",
      lastUpdated: "2026-01-01T00:00:00Z",
      doneNodeTimestamps: { n1: "2026-01-01T00:00:00Z" },
      doneLinkTimestamps: {},
    });

    const user = userEvent.setup();
    render(<ExportButton />);
    await user.click(screen.getByLabelText("Export progress"));

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("does not trigger a download when no progress exists", async () => {
    const user = userEvent.setup();
    render(<ExportButton />);
    await user.click(screen.getByLabelText("Export progress"));

    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
