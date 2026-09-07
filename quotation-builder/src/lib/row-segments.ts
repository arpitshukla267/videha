import { A4_PAGE_BREAK_GAP_PX, contentBudget, minPageStartSpace } from "./a4";

export type RowMeta = {
  totalHeight: number;
  lineHeight: number;
  lineCount: number;
  /** Height of the first segment including meta columns and the first desc line. */
  baseHeight: number;
  /** Height of a continuation row showing one desc line (no meta columns). */
  continuationLineBlock: number;
};

export type RowSegment = {
  itemId: string;
  lineStart: number;
  lineEnd: number;
  lineCount: number;
  lineHeight: number;
  showMeta: boolean;
};

export type TablePageSlice = {
  segments: RowSegment[];
  /** Segment keys `${itemId}@${lineEnd}` that end with a page break after them. */
  pageBreakAfterSegmentKeys: string[];
};

function segmentKey(itemId: string, lineEnd: number): string {
  return `${itemId}@${lineEnd}`;
}

export function measureRowMeta(row: HTMLTableRowElement): RowMeta {
  const desc = row.querySelector(".desc") as HTMLElement | null;
  const totalHeight = Math.ceil(row.getBoundingClientRect().height);

  if (!desc) {
    return {
      totalHeight,
      lineHeight: 16,
      lineCount: 1,
      baseHeight: totalHeight,
      continuationLineBlock: totalHeight,
    };
  }

  const style = window.getComputedStyle(desc);
  const parsedLineHeight = parseFloat(style.lineHeight);
  const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : 16;
  const lineCount = Math.max(1, Math.round(desc.scrollHeight / lineHeight));
  const baseHeight = Math.max(lineHeight + 20, totalHeight - (lineCount - 1) * lineHeight);
  const continuationLineBlock = lineHeight + 20;

  return {
    totalHeight,
    lineHeight,
    lineCount,
    baseHeight,
    continuationLineBlock,
  };
}

export function segmentHeight(meta: RowMeta, segment: Pick<RowSegment, "lineStart" | "lineEnd" | "showMeta">): number {
  const lines = segment.lineEnd - segment.lineStart;
  if (lines <= 0) return 0;

  if (segment.showMeta) {
    return meta.baseHeight + Math.max(0, lines - 1) * meta.lineHeight;
  }

  return meta.continuationLineBlock + Math.max(0, lines - 1) * meta.lineHeight;
}

function maxLinesThatFit(
  meta: RowMeta,
  lineStart: number,
  lineCount: number,
  showMeta: boolean,
  maxHeight: number,
): number {
  const linesLeft = lineCount - lineStart;
  let fit = 0;

  for (let lines = 1; lines <= linesLeft; lines += 1) {
    const height = segmentHeight(meta, { lineStart, lineEnd: lineStart + lines, showMeta });
    if (height <= maxHeight) fit = lines;
    else break;
  }

  return fit;
}

export function paginateTableRows(
  itemIds: string[],
  rowMeta: Record<string, RowMeta>,
  theadHeight: number,
  maxContent: number,
  initialUsed: number,
): { slices: TablePageSlice[]; finalUsed: number } {
  const slices: TablePageSlice[] = [];
  let used = initialUsed;
  let current: TablePageSlice = { segments: [], pageBreakAfterSegmentKeys: [] };
  let tableOpen = false;

  const minStart = minPageStartSpace(maxContent);

  const openTable = () => {
    if (tableOpen) return;
    if (used + theadHeight > maxContent && current.segments.length > 0) {
      slices.push(current);
      current = { segments: [], pageBreakAfterSegmentKeys: [] };
      used = 0;
    }
    used += theadHeight;
    tableOpen = true;
  };

  const closePage = () => {
    if (current.segments.length > 0 || slices.length === 0) {
      slices.push(current);
      current = { segments: [], pageBreakAfterSegmentKeys: [] };
    }
    used = 0;
    tableOpen = false;
  };

  for (const itemId of itemIds) {
    const meta = rowMeta[itemId] ?? {
      totalHeight: 32,
      lineHeight: 16,
      lineCount: 1,
      baseHeight: 32,
      continuationLineBlock: 20,
    };

    let lineStart = 0;

    while (lineStart < meta.lineCount) {
      openTable();

      const remaining = maxContent - used;
      const showMeta = lineStart === 0;
      const linesLeft = meta.lineCount - lineStart;
      const fullHeight = segmentHeight(meta, {
        lineStart,
        lineEnd: lineStart + linesLeft,
        showMeta,
      });

      if (fullHeight <= remaining) {
        const segment: RowSegment = {
          itemId,
          lineStart,
          lineEnd: meta.lineCount,
          lineCount: meta.lineCount,
          lineHeight: meta.lineHeight,
          showMeta,
        };
        current.segments.push(segment);
        used += fullHeight;
        lineStart = meta.lineCount;
        continue;
      }

      if (remaining < minStart && current.segments.length > 0) {
        current.pageBreakAfterSegmentKeys.push(
          segmentKey(
            current.segments[current.segments.length - 1].itemId,
            current.segments[current.segments.length - 1].lineEnd,
          ),
        );
        closePage();
        continue;
      }

      let linesToFit = maxLinesThatFit(meta, lineStart, meta.lineCount, showMeta, remaining);

      if (linesToFit === 0) {
        if (current.segments.length > 0) {
          current.pageBreakAfterSegmentKeys.push(
            segmentKey(
              current.segments[current.segments.length - 1].itemId,
              current.segments[current.segments.length - 1].lineEnd,
            ),
          );
          closePage();
          continue;
        }
        linesToFit = 1;
      }

      const lineEnd = lineStart + linesToFit;
      const segment: RowSegment = {
        itemId,
        lineStart,
        lineEnd,
        lineCount: meta.lineCount,
        lineHeight: meta.lineHeight,
        showMeta,
      };
      current.segments.push(segment);
      used += segmentHeight(meta, segment);

      if (lineEnd < meta.lineCount) {
        current.pageBreakAfterSegmentKeys.push(segmentKey(itemId, lineEnd));
        closePage();
      }

      lineStart = lineEnd;
    }
  }

  if (current.segments.length > 0 || slices.length === 0) {
    slices.push(current);
  }

  return { slices, finalUsed: used };
}

export function tableSliceHeight(
  slice: TablePageSlice,
  rowMeta: Record<string, RowMeta>,
  theadHeight: number,
): number {
  let used = theadHeight;
  for (const segment of slice.segments) {
    const meta = rowMeta[segment.itemId];
    if (!meta) continue;
    used += segmentHeight(meta, segment);
  }
  if (slice.pageBreakAfterSegmentKeys.length > 0) used += A4_PAGE_BREAK_GAP_PX;
  return used;
}
