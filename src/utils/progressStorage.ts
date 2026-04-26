/**
 * Progress persistence module for localStorage-backed done-state storage.
 *
 * Provides read/write/validate/import/export helpers for the ProgressPayload
 * contract defined in types/types.ts. All localStorage operations are wrapped
 * in try/catch so failures never block core navigation.
 */

import type {
  ImportResult,
  ImportStrategy,
  ProgressPayload,
  ValidationResult,
} from "../types/types";

const STORAGE_KEY = "webbrain:progress:v1";
const CURRENT_SCHEMA_VERSION = "1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deduplicate an array of strings, preserving order of first occurrence.
 */
function deduplicate(ids: string[]): string[] {
  return [...new Set(ids)];
}

/**
 * Return true when the value looks like a non-empty string (basic ID check).
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validate that a value is a Record<string, string> (string keys, string values).
 */
function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.entries(value as Record<string, unknown>).every(
    ([k, v]) => typeof k === "string" && typeof v === "string",
  );
}

/**
 * Normalize a payload by deduplicating arrays and ensuring required shapes.
 */
function normalizePayload(payload: ProgressPayload): ProgressPayload {
  return {
    ...payload,
    schemaVersion: payload.schemaVersion,
    lastUpdated: new Date().toISOString(),
    doneNodeTimestamps: { ...payload.doneNodeTimestamps },
    doneLinkTimestamps: { ...payload.doneLinkTimestamps },
    markedForStudyNodeIds: deduplicate(payload.markedForStudyNodeIds ?? []),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate an unknown value against the ProgressPayload schema.
 * Returns `{ ok: true }` when valid, or `{ ok: false, errors }` with
 * actionable messages when not.
 */
export function validateProgressPayload(obj: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return { ok: false, errors: ["Payload must be a non-null object."] };
  }

  const record = obj as Record<string, unknown>;

  if (typeof record.schemaVersion !== "string") {
    errors.push("Missing or invalid 'schemaVersion' (expected string).");
  }

  if (typeof record.lastUpdated !== "string") {
    errors.push("Missing or invalid 'lastUpdated' (expected ISO-8601 string).");
  }

  if (!isStringRecord(record.doneNodeTimestamps)) {
    errors.push(
      "Missing or invalid 'doneNodeTimestamps' (expected Record<string, string>).",
    );
  } else {
    for (const [id, ts] of Object.entries(
      record.doneNodeTimestamps as Record<string, string>,
    )) {
      if (!isNonEmptyString(id)) {
        errors.push(
          `Invalid node ID key in doneNodeTimestamps: '${String(id)}'.`,
        );
      }
      if (!isNonEmptyString(ts)) {
        errors.push(
          `Invalid timestamp for node '${id}' in doneNodeTimestamps.`,
        );
      }
    }
  }

  if (!isStringRecord(record.doneLinkTimestamps)) {
    errors.push(
      "Missing or invalid 'doneLinkTimestamps' (expected Record<string, string>).",
    );
  } else {
    for (const [id, ts] of Object.entries(
      record.doneLinkTimestamps as Record<string, string>,
    )) {
      if (!isNonEmptyString(id)) {
        errors.push(
          `Invalid link ID key in doneLinkTimestamps: '${String(id)}'.`,
        );
      }
      if (!isNonEmptyString(ts)) {
        errors.push(
          `Invalid timestamp for link '${id}' in doneLinkTimestamps.`,
        );
      }
    }
  }

  if (record.markedForStudyNodeIds !== undefined) {
    if (
      !Array.isArray(record.markedForStudyNodeIds) ||
      !(record.markedForStudyNodeIds as unknown[]).every(isNonEmptyString)
    ) {
      errors.push(
        "Invalid 'markedForStudyNodeIds' (expected string[] or undefined).",
      );
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// ---------------------------------------------------------------------------
// Local storage read / write
// ---------------------------------------------------------------------------

/**
 * Read and validate local progress from localStorage.
 * Returns null when missing or corrupt (logs a warning on corrupt data).
 */
export function getLocalProgress(): ProgressPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    const validation = validateProgressPayload(parsed);
    if (!validation.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        "Corrupt progress payload in localStorage — falling back to empty state.",
        validation.errors,
      );
      return null;
    }
    return parsed as ProgressPayload;
  } catch {
    // eslint-disable-next-line no-console
    console.warn(
      "Failed to read progress from localStorage — falling back to empty state.",
    );
    return null;
  }
}

/**
 * Persist a ProgressPayload to localStorage.
 * Normalizes the payload before writing. Returns false on write failure.
 */
export function saveLocalProgress(payload: ProgressPayload): boolean {
  try {
    const normalized = normalizePayload(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    // eslint-disable-next-line no-console
    console.warn("Failed to write progress to localStorage.");
    return false;
  }
}

/**
 * Remove all persisted progress from localStorage.
 */
export function clearLocalProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // eslint-disable-next-line no-console
    console.warn("Failed to clear progress from localStorage.");
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Serialize the current local progress to a JSON string suitable for file
 * download. Returns the JSON string, or null if no progress exists.
 */
export function exportProgress(): string | null {
  const payload = getLocalProgress();
  if (!payload) {
    return null;
  }
  return JSON.stringify(normalizePayload(payload), null, 2);
}

// ---------------------------------------------------------------------------
// Import strategies
// ---------------------------------------------------------------------------

/**
 * Apply the Merge strategy: union of done sets, latest timestamp wins on
 * conflicts, union of markedForStudyNodeIds.
 */
function applyMerge(
  local: ProgressPayload,
  imported: ProgressPayload,
): ProgressPayload {
  const mergedNodeTimestamps = { ...local.doneNodeTimestamps };
  for (const [id, ts] of Object.entries(imported.doneNodeTimestamps)) {
    if (!mergedNodeTimestamps[id] || ts > mergedNodeTimestamps[id]) {
      mergedNodeTimestamps[id] = ts;
    }
  }

  const mergedLinkTimestamps = { ...local.doneLinkTimestamps };
  for (const [id, ts] of Object.entries(imported.doneLinkTimestamps)) {
    if (!mergedLinkTimestamps[id] || ts > mergedLinkTimestamps[id]) {
      mergedLinkTimestamps[id] = ts;
    }
  }

  const mergedStudy = deduplicate([
    ...(local.markedForStudyNodeIds ?? []),
    ...(imported.markedForStudyNodeIds ?? []),
  ]);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    doneNodeTimestamps: mergedNodeTimestamps,
    doneLinkTimestamps: mergedLinkTimestamps,
    markedForStudyNodeIds: mergedStudy,
  };
}

/**
 * Apply the Replace strategy: imported payload fully overwrites local.
 */
function applyReplace(imported: ProgressPayload): ProgressPayload {
  return normalizePayload(imported);
}

/**
 * Apply the Study-Diff strategy: local done state stays unchanged, imported-
 * only done node IDs become markedForStudyNodeIds.
 */
function applyStudyDiff(
  local: ProgressPayload,
  imported: ProgressPayload,
): ProgressPayload {
  const localDoneNodeIds = new Set(Object.keys(local.doneNodeTimestamps));
  const importedOnlyNodeIds = Object.keys(imported.doneNodeTimestamps).filter(
    (id) => !localDoneNodeIds.has(id),
  );

  const mergedStudy = deduplicate([
    ...(local.markedForStudyNodeIds ?? []),
    ...importedOnlyNodeIds,
  ]);

  return {
    ...local,
    lastUpdated: new Date().toISOString(),
    markedForStudyNodeIds: mergedStudy,
  };
}

/**
 * Read a File as text using FileReader (works in jsdom and all browsers).
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string); // eslint-disable-line jsdoc/require-jsdoc
    reader.onerror = () => reject(reader.error); // eslint-disable-line jsdoc/require-jsdoc
    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// Import entry point
// ---------------------------------------------------------------------------

/**
 * Read a File, validate its contents, and apply the chosen import strategy
 * against existing local progress. Persists the result to localStorage.
 *
 * Never mutates local state on validation or strategy failure.
 */
export async function importProgressFromFile(
  file: File,
  strategy: ImportStrategy,
): Promise<ImportResult> {
  let parsed: unknown;
  try {
    const text = await readFileAsText(file);
    parsed = JSON.parse(text);
  } catch {
    return { success: false, errors: ["File is not valid JSON."] };
  }

  const validation = validateProgressPayload(parsed);
  if (!validation.ok) {
    return { success: false, errors: validation.errors };
  }

  const imported = parsed as ProgressPayload;
  const local = getLocalProgress();

  let result: ProgressPayload;

  if (!local) {
    result = normalizePayload(imported);
  } else {
    switch (strategy) {
      case "Merge":
        result = applyMerge(local, imported);
        break;
      case "Replace":
        result = applyReplace(imported);
        break;
      case "Study-Diff":
        result = applyStudyDiff(local, imported);
        break;
    }
  }

  const saved = saveLocalProgress(result);
  if (!saved) {
    return {
      success: false,
      errors: ["Import succeeded but failed to persist to localStorage."],
    };
  }

  return { success: true, payload: result };
}
