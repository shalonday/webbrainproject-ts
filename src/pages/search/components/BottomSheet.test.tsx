import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BottomSheet } from "./BottomSheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  currentNodeId: null,
  doneNodeIds: [],
  isMoveForwardEnabled: false,
  isSearchActive: false,
  onGeneratePath: vi.fn(),
  onKeyDown: vi.fn(),
  onMoveForward: vi.fn(),
  onPathNodeClick: vi.fn(),
  onResultSelect: vi.fn(),
  onSearchChange: vi.fn(),
  onSearchSubmit: vi.fn(),
  pathTree: null,
  recommendedNodes: [],
  searchResults: [],
  searchTerm: "",
  selectedResultId: null,
};

/**
 * Returns the draggable top strip element.
 */
function getTopStrip(): HTMLElement {
  return screen.getByTestId("bottom-sheet-top-strip");
}

/**
 * Returns the small visual handle element inside the top strip.
 */
function getInnerHandle(): HTMLElement {
  return screen.getByTestId("bottom-sheet-handle");
}

/**
 * Reads the inline transform applied to the Card element during a drag.
 *
 * @returns The inline transform string, or empty string if not set.
 */
function getCardInlineTransform(): string {
  const card = screen.getByTestId("bottom-sheet") as HTMLElement;
  return card.style.transform ?? "";
}

/**
 * Simulates a pointer drag on the given element.
 *
 * @param element - The element to start the drag on.
 * @param startY - Starting clientY in pixels.
 * @param endY - Ending clientY in pixels.
 */
function simulateDrag(
  element: HTMLElement,
  startY: number,
  endY: number,
): void {
  fireEvent.pointerDown(element, { clientY: startY });
  fireEvent.pointerMove(window, { clientY: endY });
}

/**
 * Simulates a full drag-and-release interaction.
 *
 * @param element - The element to start the drag on.
 * @param startY - Starting clientY in pixels.
 * @param endY - Ending clientY in pixels.
 */
function simulateDragAndRelease(
  element: HTMLElement,
  startY: number,
  endY: number,
): void {
  simulateDrag(element, startY, endY);
  fireEvent.pointerUp(window);
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Give the card a measurable height so maxSheetOffset > 0.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    height: 400,
    width: 800,
    top: 0,
    left: 0,
    bottom: 400,
    right: 800,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BottomSheet drag handle", () => {
  it("renders the search input", () => {
    render(<BottomSheet {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(/search for a skill or url/i),
    ).toBeInTheDocument();
  });

  it("applies an inline transform to the card while dragging", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    simulateDrag(handle, 0, 80);

    const transform = getCardInlineTransform();
    expect(transform).toMatch(/translateY\(\d+(\.\d+)?px\)/);
    expect(transform).not.toBe("translateY(0px)");
  });

  it("starts dragging when pointer down is on the top strip outside the inner handle", () => {
    render(<BottomSheet {...defaultProps} />);
    const topStrip = getTopStrip();

    // Target the strip itself (currentTarget), not the small inner handle bar.
    fireEvent.pointerDown(topStrip, { clientY: 0, target: topStrip });
    fireEvent.pointerMove(window, { clientY: 60 });

    expect(getCardInlineTransform()).toBe("translateY(60px)");
  });

  it("clamps the offset to 0 when dragging upward past the open position", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    // Start at 200, move up to -100 (delta = -300, below minimum of 0)
    simulateDrag(handle, 200, -100);

    expect(getCardInlineTransform()).toBe("translateY(0px)");
  });

  it("clamps the offset to maxSheetOffset when dragging further down than allowed", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    // card height = 400, peek = 110, max = 290; drag 9999px down
    simulateDrag(handle, 0, 9999);

    expect(getCardInlineTransform()).toBe("translateY(290px)");
  });

  it("clears the inline transform on pointer up so the CSS transition takes over", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    simulateDragAndRelease(handle, 0, 80);

    expect(getCardInlineTransform()).toBe("");
  });

  it("snaps to open (offset 0) when released above the halfway point", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    // max = 290; halfway = 145; drag to 100 (below halfway) then release
    simulateDragAndRelease(handle, 0, 100);

    // After snap, inline style is cleared and state is open (offset 0).
    expect(getCardInlineTransform()).toBe("");

    // A small downward drag should start from 0 and move to 10px.
    simulateDrag(handle, 0, 10);
    expect(getCardInlineTransform()).toBe("translateY(10px)");
  });

  it("snaps closed (offset = maxSheetOffset) when released past the halfway point", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    // max = 290; halfway = 145; drag to 200 (past halfway) then release
    simulateDragAndRelease(handle, 0, 200);

    // Inline style is cleared on release; state is now closed (offset max = 290).
    expect(getCardInlineTransform()).toBe("");

    // A small downward drag from closed should remain clamped at max.
    simulateDrag(handle, 0, 10);
    expect(getCardInlineTransform()).toBe("translateY(290px)");
  });

  it("does not apply a transform before any interaction", () => {
    render(<BottomSheet {...defaultProps} />);
    expect(getCardInlineTransform()).toBe("");
  });

  it("stops tracking pointer movement after pointer up", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    simulateDragAndRelease(handle, 0, 50);

    // Further pointer moves should not change the inline transform
    fireEvent.pointerMove(window, { clientY: 200 });
    expect(getCardInlineTransform()).toBe("");
  });
});

describe("BottomSheet resize handling", () => {
  it("clamps the current offset to the new max when the window shrinks", () => {
    render(<BottomSheet {...defaultProps} />);
    const handle = getInnerHandle();

    // Drag to near max (card h=400, max=290), release past halfway → snaps closed
    simulateDragAndRelease(handle, 0, 200);

    // Now simulate the card shrinking so max drops below the current snapped offset
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      height: 150, // new max = 150 - 110 = 40
      width: 800,
      top: 0,
      left: 0,
      bottom: 150,
      right: 800,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    });

    fireEvent(window, new Event("resize"));

    // With a clamped baseline of 40, dragging upward by 30 should yield 10.
    simulateDrag(handle, 0, -30);
    expect(getCardInlineTransform()).toBe("translateY(10px)");
  });
});
