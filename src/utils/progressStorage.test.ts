import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProgressPayload } from "../types/types";
import {
  clearLocalProgress,
  exportProgress,
  getLocalProgress,
  importProgressFromFile,
  saveLocalProgress,
  validateProgressPayload,
} from "./progressStorage";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STORAGE_KEY = "webbrain:progress:v1";

/**
 * Build a minimal valid payload, optionally overriding fields.
 */
function makePayload(overrides?: Partial<ProgressPayload>): ProgressPayload {
  return {
    schemaVersion: "1",
    lastUpdated: "2026-01-01T00:00:00.000Z",
    doneNodeTimestamps: {},
    doneLinkTimestamps: {},
    markedForStudyNodeIds: [],
    ...overrides,
  };
}

/**
 * Build a File object from a plain object (JSON-serialized).
 */
function makeFile(content: unknown, name = "progress.json"): File {
  return new File([JSON.stringify(content)], name, {
    type: "application/json",
  });
}

afterEach(() => {
  localStorage.clear();
});

// ========================================================================
// validateProgressPayload
// ========================================================================

describe("validateProgressPayload", () => {
  it("accepts a minimal valid payload", () => {
    const result = validateProgressPayload(makePayload());
    expect(result.ok).toBe(true);
  });

  it("accepts a payload with populated timestamps and study IDs", () => {
    // This is still a fully valid payload: makePayload() includes required
    // schemaVersion/lastUpdated by default. We are only asserting that
    // populated timestamp maps and study IDs are also accepted.
    // Missing required fields are explicitly rejected in the tests below.
    const result = validateProgressPayload(
      makePayload({
        doneNodeTimestamps: { n1: "2026-03-01T00:00:00Z" },
        doneLinkTimestamps: { l1: "2026-03-01T00:00:00Z" },
        markedForStudyNodeIds: ["n2"],
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("accepts unknown extra fields (forward compat)", () => {
    const result = validateProgressPayload({
      ...makePayload(),
      futureField: 42,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects null", () => {
    const result = validateProgressPayload(null);
    expect(result.ok).toBe(false);
  });

  it("rejects an array", () => {
    const result = validateProgressPayload([]);
    expect(result.ok).toBe(false);
  });

  it("rejects missing schemaVersion", () => {
    const { schemaVersion: _, ...rest } = makePayload();
    void _;
    const result = validateProgressPayload(rest);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Missing or invalid 'schemaVersion' (expected string).",
    );
  });

  it("rejects missing lastUpdated", () => {
    const { lastUpdated: _, ...rest } = makePayload();
    void _;
    const result = validateProgressPayload(rest);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Missing or invalid 'lastUpdated' (expected ISO-8601 string).",
    );
  });

  it("rejects missing doneNodeTimestamps", () => {
    const { doneNodeTimestamps: _, ...rest } = makePayload();
    void _;
    const result = validateProgressPayload(rest);
    expect(result.ok).toBe(false);
  });

  it("rejects missing doneLinkTimestamps", () => {
    const { doneLinkTimestamps: _, ...rest } = makePayload();
    void _;
    const result = validateProgressPayload(rest);
    expect(result.ok).toBe(false);
  });

  it("rejects non-string values in doneNodeTimestamps", () => {
    const result = validateProgressPayload({
      ...makePayload(),
      doneNodeTimestamps: { n1: 123 },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects non-string array entries in markedForStudyNodeIds", () => {
    const result = validateProgressPayload({
      ...makePayload(),
      markedForStudyNodeIds: [42],
    });
    expect(result.ok).toBe(false);
  });

  it("collects multiple errors at once", () => {
    const result = validateProgressPayload({});
    expect(result.ok).toBe(false);
    expect(result.errors!.length).toBeGreaterThanOrEqual(4);
  });
});

// ========================================================================
// getLocalProgress / saveLocalProgress / clearLocalProgress
// ========================================================================

describe("localStorage round-trip", () => {
  it("returns null when localStorage is empty", () => {
    expect(getLocalProgress()).toBeNull();
  });

  it("saves and retrieves a valid payload", () => {
    const payload = makePayload({
      doneNodeTimestamps: { n1: "2026-03-01T00:00:00Z" },
    });
    saveLocalProgress(payload);
    const loaded = getLocalProgress();
    expect(loaded).not.toBeNull();
    expect(Object.keys(loaded!.doneNodeTimestamps)).toContain("n1");
  });

  it("returns null for corrupt JSON in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{{");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loaded = getLocalProgress();
    expect(loaded).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("returns null for valid JSON that fails schema validation", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bad: true }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loaded = getLocalProgress();
    expect(loaded).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("saveLocalProgress normalizes and deduplicates markedForStudyNodeIds", () => {
    const payload = makePayload({
      markedForStudyNodeIds: ["a", "b", "a"],
    });
    saveLocalProgress(payload);
    const loaded = getLocalProgress();
    expect(loaded!.markedForStudyNodeIds).toEqual(["a", "b"]);
  });

  it("saveLocalProgress updates lastUpdated to current time", () => {
    const payload = makePayload({ lastUpdated: "2000-01-01T00:00:00Z" });
    saveLocalProgress(payload);
    const loaded = getLocalProgress();
    expect(loaded!.lastUpdated).not.toBe("2000-01-01T00:00:00Z");
    expect(new Date(loaded!.lastUpdated).getFullYear()).toBeGreaterThanOrEqual(
      2026,
    );
  });

  it("saveLocalProgress preserves metadata through normalization", () => {
    const payload = makePayload({
      metadata: { custom: "value" },
    });
    saveLocalProgress(payload);
    const loaded = getLocalProgress();
    expect(loaded!.metadata).toEqual({ custom: "value" });
  });

  it("clearLocalProgress removes the stored entry", () => {
    saveLocalProgress(makePayload());
    expect(getLocalProgress()).not.toBeNull();
    clearLocalProgress();
    expect(getLocalProgress()).toBeNull();
  });

  it("saveLocalProgress returns false on quota error", () => {
    const original = localStorage.setItem;
    /** Simulate QuotaExceededError */
    localStorage.setItem = () => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = saveLocalProgress(makePayload());
    expect(result).toBe(false);
    warnSpy.mockRestore();
    localStorage.setItem = original;
  });

  it("getLocalProgress returns null when localStorage.getItem throws", () => {
    const original = localStorage.getItem;
    /**
     *
     */
    localStorage.getItem = () => {
      throw new DOMException("access denied", "SecurityError");
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = getLocalProgress();
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    localStorage.getItem = original;
  });

  it("clearLocalProgress handles error when localStorage.removeItem throws", () => {
    const original = localStorage.removeItem;
    /**
     *
     */
    localStorage.removeItem = () => {
      throw new DOMException("access denied", "SecurityError");
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    clearLocalProgress();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    localStorage.removeItem = original;
  });
});

// ========================================================================
// exportProgress
// ========================================================================

describe("exportProgress", () => {
  it("returns null when no progress exists", () => {
    expect(exportProgress()).toBeNull();
  });

  it("returns valid JSON matching the stored payload", () => {
    const payload = makePayload({
      doneNodeTimestamps: { n1: "2026-03-01T00:00:00Z" },
    });
    saveLocalProgress(payload);
    const exported = exportProgress();
    expect(exported).not.toBeNull();
    const parsed = JSON.parse(exported!);
    expect(parsed.doneNodeTimestamps.n1).toBe("2026-03-01T00:00:00Z");
    expect(parsed.schemaVersion).toBe("1");
  });
});

// ========================================================================
// importProgressFromFile — Merge strategy
// ========================================================================

describe("importProgressFromFile — Merge", () => {
  it("unions done node and link timestamps, keeping latest on conflict", async () => {
    saveLocalProgress(
      makePayload({
        doneNodeTimestamps: {
          shared: "2026-01-01T00:00:00Z",
          localOnly: "2026-02-01T00:00:00Z",
        },
        doneLinkTimestamps: {
          sharedLink: "2026-01-01T00:00:00Z",
        },
      }),
    );

    const imported = makePayload({
      doneNodeTimestamps: {
        shared: "2026-06-01T00:00:00Z",
        importedOnly: "2026-03-01T00:00:00Z",
      },
      doneLinkTimestamps: {
        sharedLink: "2026-06-01T00:00:00Z",
        importedOnlyLink: "2026-03-01T00:00:00Z",
      },
    });

    const result = await importProgressFromFile(makeFile(imported), "Merge");
    expect(result.success).toBe(true);

    const persisted = getLocalProgress()!;
    // Union of keys
    expect(Object.keys(persisted.doneNodeTimestamps)).toEqual(
      expect.arrayContaining(["shared", "localOnly", "importedOnly"]),
    );
    // Latest wins on conflict
    expect(persisted.doneNodeTimestamps.shared).toBe("2026-06-01T00:00:00Z");
    // Local-only preserved
    expect(persisted.doneNodeTimestamps.localOnly).toBe("2026-02-01T00:00:00Z");
    // Imported-only preserved
    expect(persisted.doneNodeTimestamps.importedOnly).toBe(
      "2026-03-01T00:00:00Z",
    );
    // Link timestamps merged
    expect(persisted.doneLinkTimestamps.sharedLink).toBe(
      "2026-06-01T00:00:00Z",
    );
    expect(persisted.doneLinkTimestamps.importedOnlyLink).toBe(
      "2026-03-01T00:00:00Z",
    );
  });

  it("unions markedForStudyNodeIds", async () => {
    saveLocalProgress(makePayload({ markedForStudyNodeIds: ["a", "b"] }));
    const imported = makePayload({ markedForStudyNodeIds: ["b", "c"] });
    const result = await importProgressFromFile(makeFile(imported), "Merge");
    expect(result.success).toBe(true);

    const persisted = getLocalProgress()!;
    expect(persisted.markedForStudyNodeIds).toEqual(
      expect.arrayContaining(["a", "b", "c"]),
    );
    // Deduplicated
    expect(persisted.markedForStudyNodeIds!.length).toBe(3);
  });
});

// ========================================================================
// importProgressFromFile — Replace strategy
// ========================================================================

describe("importProgressFromFile — Replace", () => {
  it("fully replaces local with imported payload", async () => {
    saveLocalProgress(
      makePayload({
        doneNodeTimestamps: { localNode: "2026-01-01T00:00:00Z" },
        doneLinkTimestamps: { localLink: "2026-01-01T00:00:00Z" },
        markedForStudyNodeIds: ["localStudy"],
      }),
    );

    const imported = makePayload({
      doneNodeTimestamps: { importedNode: "2026-06-01T00:00:00Z" },
      doneLinkTimestamps: { importedLink: "2026-06-01T00:00:00Z" },
      markedForStudyNodeIds: ["importedStudy"],
    });

    const result = await importProgressFromFile(makeFile(imported), "Replace");
    expect(result.success).toBe(true);

    const persisted = getLocalProgress()!;
    expect(Object.keys(persisted.doneNodeTimestamps)).toEqual(["importedNode"]);
    expect(Object.keys(persisted.doneLinkTimestamps)).toEqual(["importedLink"]);
    expect(persisted.doneNodeTimestamps.importedNode).toBe(
      "2026-06-01T00:00:00Z",
    );
    expect(persisted.doneLinkTimestamps.importedLink).toBe(
      "2026-06-01T00:00:00Z",
    );
    expect(persisted.markedForStudyNodeIds).toEqual(["importedStudy"]);
    // localNode is gone
    expect(persisted.doneNodeTimestamps.localNode).toBeUndefined();
  });
});

// ========================================================================
// importProgressFromFile — Study-Diff strategy
// ========================================================================

describe("importProgressFromFile — Study-Diff", () => {
  it("adds imported-only done nodes to markedForStudyNodeIds without changing local done state", async () => {
    saveLocalProgress(
      makePayload({
        doneNodeTimestamps: { shared: "2026-01-01T00:00:00Z" },
        doneLinkTimestamps: { link1: "2026-01-01T00:00:00Z" },
      }),
    );

    const imported = makePayload({
      doneNodeTimestamps: {
        shared: "2026-06-01T00:00:00Z",
        importedOnly: "2026-03-01T00:00:00Z",
      },
      doneLinkTimestamps: {},
    });

    const result = await importProgressFromFile(
      makeFile(imported),
      "Study-Diff",
    );
    expect(result.success).toBe(true);

    const persisted = getLocalProgress()!;
    // Local done state unchanged
    expect(Object.keys(persisted.doneNodeTimestamps)).toEqual(["shared"]);
    expect(persisted.doneNodeTimestamps.shared).toBe("2026-01-01T00:00:00Z");
    // Local links unchanged
    expect(Object.keys(persisted.doneLinkTimestamps)).toEqual(["link1"]);
    // Imported-only done node added to study markers
    expect(persisted.markedForStudyNodeIds).toContain("importedOnly");
    // Shared node NOT in study markers (already done locally)
    expect(persisted.markedForStudyNodeIds).not.toContain("shared");
  });

  it("does not duplicate markedForStudyNodeIds when imported-only matches existing study", async () => {
    saveLocalProgress(
      makePayload({
        doneNodeTimestamps: {},
        markedForStudyNodeIds: ["existingStudy"],
      }),
    );
    const imported = makePayload({
      doneNodeTimestamps: { existingStudy: "2026-01-01T00:00:00Z" },
    });

    const result = await importProgressFromFile(
      makeFile(imported),
      "Study-Diff",
    );
    expect(result.success).toBe(true);

    const persisted = getLocalProgress()!;
    const occurrences = persisted.markedForStudyNodeIds!.filter(
      (id) => id === "existingStudy",
    );
    expect(occurrences.length).toBe(1);
  });
});

// ========================================================================
// importProgressFromFile — no local progress
// ========================================================================

describe("importProgressFromFile — no local progress", () => {
  it("applies imported payload directly when localStorage is empty", async () => {
    expect(getLocalProgress()).toBeNull();

    const imported = makePayload({
      doneNodeTimestamps: { n1: "2026-03-01T00:00:00Z" },
    });
    const result = await importProgressFromFile(makeFile(imported), "Merge");
    expect(result.success).toBe(true);

    const persisted = getLocalProgress()!;
    expect(persisted.doneNodeTimestamps.n1).toBe("2026-03-01T00:00:00Z");
  });
});

// ========================================================================
// importProgressFromFile — negative / validation
// ========================================================================

describe("importProgressFromFile — negative cases", () => {
  it("rejects non-JSON file", async () => {
    const blob = new Blob(["not json{{{"], { type: "text/plain" });
    const file = new File([blob], "bad.json");
    const result = await importProgressFromFile(file, "Merge");
    expect(result.success).toBe(false);
    expect(result.errors).toContain("File is not valid JSON.");
  });

  it("rejects JSON that fails schema validation", async () => {
    const file = makeFile({ bad: true });
    const result = await importProgressFromFile(file, "Merge");
    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("never mutates local state on failed import", async () => {
    saveLocalProgress(
      makePayload({
        doneNodeTimestamps: { original: "2026-01-01T00:00:00Z" },
      }),
    );
    const file = makeFile({ bad: true });
    await importProgressFromFile(file, "Merge");
    const persisted = getLocalProgress()!;
    expect(persisted.doneNodeTimestamps.original).toBe("2026-01-01T00:00:00Z");
  });

  it("returns failure when localStorage save fails during import", async () => {
    saveLocalProgress(
      makePayload({
        doneNodeTimestamps: { original: "2026-01-01T00:00:00Z" },
      }),
    );

    const imported = makePayload({
      doneNodeTimestamps: { imported: "2026-06-01T00:00:00Z" },
    });

    // Simulate quota error only on the next setItem (import write)
    const original = localStorage.setItem;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    /**
     *
     */
    localStorage.setItem = () => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    };

    const result = await importProgressFromFile(makeFile(imported), "Merge");

    localStorage.setItem = original;
    warnSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "Import succeeded but failed to persist to localStorage.",
    );
  });
});
