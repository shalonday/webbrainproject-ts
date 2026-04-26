import { Box, Card } from "@mui/material";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Tree, WBNode } from "../../../types/types";
import { ActionButtons } from "./ActionButtons";
import { PathList } from "./PathList";
import { RecommendedList } from "./RecommendedList";
import { ResultsList } from "./ResultsList";
import { SearchInput } from "./SearchInput";

const SHEET_PEEK_HEIGHT_PX = 110;

/**
 * Clamps a numeric value to the provided range.
 *
 * @param value - Value to clamp.
 * @param min - Minimum allowed value.
 * @param max - Maximum allowed value.
 * @returns Clamped value.
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

interface BottomSheetProps {
  currentNodeId: string | null;
  doneNodeIds: string[];
  isMoveForwardEnabled: boolean;
  isSearchActive: boolean;
  onGeneratePath: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onMoveForward: () => void;
  onPathNodeClick: (node: WBNode) => void;
  onResultSelect: (nodeId: string) => void;
  onSearchChange: (value: string) => void;
  pathTree: Tree | null;
  recommendedNodes: WBNode[];
  searchResults: WBNode[];
  searchTerm: string;
  selectedResultId: string | null;
}

/**
 * Draggable Waze-style bottom sheet component.
 * Owns drag-to-collapse/expand state and renders the search/path/recommended content.
 *
 * @param props - Component props.
 * @param props.currentNodeId - ID of the current node in traversal.
 * @param props.doneNodeIds - Array of completed node IDs.
 * @param props.isMoveForwardEnabled - Whether the Move Forward action is enabled.
 * @param props.isSearchActive - Whether a search is currently active.
 * @param props.onGeneratePath - Callback to generate a learning path.
 * @param props.onKeyDown - Keyboard event handler for the search input.
 * @param props.onMoveForward - Callback to move forward in the path.
 * @param props.onPathNodeClick - Callback when a path node is clicked.
 * @param props.onResultSelect - Callback when a search result is selected.
 * @param props.onSearchChange - Callback when the search term changes.
 * @param props.pathTree - Current learning path tree, or null if none.
 * @param props.recommendedNodes - Array of recommended nodes to display.
 * @param props.searchResults - Array of nodes matching the search.
 * @param props.searchTerm - Current search term.
 * @param props.selectedResultId - ID of the currently selected search result.
 * @returns The rendered bottom sheet.
 */
export function BottomSheet({
  currentNodeId,
  doneNodeIds,
  isMoveForwardEnabled,
  isSearchActive,
  onGeneratePath,
  onKeyDown,
  onMoveForward,
  onPathNodeClick,
  onResultSelect,
  onSearchChange,
  pathTree,
  recommendedNodes,
  searchResults,
  searchTerm,
  selectedResultId,
}: BottomSheetProps): ReactNode {
  /** Post-snap translateY offset in pixels; drives the CSS transform between snaps. Not updated during active dragging. */
  const [sheetOffset, setSheetOffset] = useState(0);
  /** True while the user is actively dragging the sheet; disables the CSS transition. */
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  /** Ref to the Card DOM element, used to measure its height for drag bounds. */
  const cardRef = useRef<HTMLDivElement | null>(null);
  /** Pointer Y coordinate at the moment the drag began (clientY on pointerdown). */
  const dragStartYRef = useRef(0);
  /** Sheet offset at the moment the drag began; delta is added to this each move event. */
  const dragStartOffsetRef = useRef(0);
  /** Ref mirror of sheetOffset for synchronous reads inside window event handlers. */
  const sheetOffsetRef = useRef(0);
  /** Maximum downward offset allowed: card height minus the peek height. */
  const maxSheetOffsetRef = useRef(0);

  /**
   * Calculates the furthest downward translation for the sheet.
   * Keeps a small portion visible so users can drag it back up.
   *
   * @returns Maximum downward offset in pixels.
   */
  const calculateMaxSheetOffset = () => {
    const cardHeight = cardRef.current?.getBoundingClientRect().height ?? 0;
    return Math.max(0, cardHeight - SHEET_PEEK_HEIGHT_PX);
  };

  /**
   * Starts dragging the sheet from the top strip area.
   *
   * @param event - Pointer down event.
   */
  const handleSheetPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    maxSheetOffsetRef.current = calculateMaxSheetOffset();
    dragStartYRef.current = event.clientY;
    dragStartOffsetRef.current = sheetOffsetRef.current;
    setIsDraggingSheet(true);
  };

  /**
   * Handles pointer movement while dragging the sheet.
   *
   * @param event - Pointer move event.
   */
  const handleSheetPointerMove = useCallback((event: PointerEvent) => {
    const deltaY = event.clientY - dragStartYRef.current;
    const nextOffset = clamp(
      dragStartOffsetRef.current + deltaY,
      0,
      maxSheetOffsetRef.current,
    );
    sheetOffsetRef.current = nextOffset;
    // Write directly to the DOM to avoid scheduling a React re-render on every move event.
    if (cardRef.current) {
      cardRef.current.style.transform = `translateY(${nextOffset}px)`;
    }
  }, []);

  /**
   * Ends drag interaction and snaps the sheet to open or collapsed position.
   */
  const handleSheetPointerUp = useCallback(() => {
    setIsDraggingSheet(false);
    const shouldClose = sheetOffsetRef.current > maxSheetOffsetRef.current / 2;
    const snappedOffset = shouldClose ? maxSheetOffsetRef.current : 0;
    sheetOffsetRef.current = snappedOffset;
    // Clear the inline style so the state-driven sx transform takes over,
    // allowing the CSS transition to animate to the snapped position.
    if (cardRef.current) {
      cardRef.current.style.transform = "";
    }
    setSheetOffset(snappedOffset);
  }, []);

  useEffect(() => {
    if (!isDraggingSheet) {
      return;
    }

    window.addEventListener("pointermove", handleSheetPointerMove);
    window.addEventListener("pointerup", handleSheetPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleSheetPointerMove);
      window.removeEventListener("pointerup", handleSheetPointerUp);
    };
  }, [handleSheetPointerMove, handleSheetPointerUp, isDraggingSheet]);

  useEffect(() => {
    /**
     * Recomputes sheet drag bounds when viewport size changes.
     */
    const handleResize = () => {
      maxSheetOffsetRef.current = calculateMaxSheetOffset();
      setSheetOffset((previousOffset) => {
        const clampedOffset = clamp(
          previousOffset,
          0,
          maxSheetOffsetRef.current,
        );
        sheetOffsetRef.current = clampedOffset;
        return clampedOffset;
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Card
      data-testid="bottom-sheet"
      ref={cardRef}
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "60vh",
        minHeight: "40vh",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        overflow: "hidden",
        transform: `translateY(${sheetOffset}px)`,
        transition: isDraggingSheet
          ? "none"
          : "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
        willChange: "transform",
      }}
    >
      {/* Draggable Top Strip */}
      <Box
        data-testid="bottom-sheet-top-strip"
        onPointerDown={handleSheetPointerDown}
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pt: 1,
          pb: 1,
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <Box
          data-testid="bottom-sheet-handle"
          sx={{
            width: 40,
            height: 4,
            backgroundColor: "grey.300",
            borderRadius: 2,
          }}
        />
      </Box>

      <SearchInput
        value={searchTerm}
        onSearchChange={onSearchChange}
        onKeyDown={onKeyDown}
      />

      {/* Results or Recommended Section */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
        {pathTree ? (
          <PathList
            pathNodes={pathTree.nodes}
            currentNodeId={currentNodeId}
            doneNodeIds={doneNodeIds}
            onPathNodeClick={onPathNodeClick}
          />
        ) : isSearchActive ? (
          <ResultsList
            results={searchResults}
            selectedResultId={selectedResultId}
            onResultSelect={onResultSelect}
            searchTerm={searchTerm}
          />
        ) : (
          <RecommendedList recommendedNodes={recommendedNodes} />
        )}
      </Box>

      {/* Action Buttons */}
      <ActionButtons
        isSearchActive={isSearchActive}
        hasSearchResults={searchResults.length > 0}
        hasPath={Boolean(pathTree && pathTree.nodes.length > 0)}
        selectedResultId={selectedResultId}
        isMoveForwardEnabled={isMoveForwardEnabled}
        onGeneratePath={onGeneratePath}
        onMoveForward={onMoveForward}
      />
    </Card>
  );
}
