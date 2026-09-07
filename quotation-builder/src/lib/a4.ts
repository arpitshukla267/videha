/** Minimum free space (ratio of content area) required to start a product on the current page. */
export const MIN_PAGE_START_RATIO = 0.2;

/** A4 page dimensions at 96dpi — matches `.qb-a4` in CSS. */
export const A4_PAGE_WIDTH_PX = 794;
export const A4_PAGE_HEIGHT_PX = 1123;
export const A4_PAGE_PADDING_TOP_PX = 28;
export const A4_PAGE_PADDING_BOTTOM_PX = 32;
/** Extra space before a page break so the last row is not clipped. */
export const A4_PAGE_BREAK_GAP_PX = 14;

export function contentBudget(pageFooterHeight: number): number {
  return (
    A4_PAGE_HEIGHT_PX -
    A4_PAGE_PADDING_TOP_PX -
    A4_PAGE_PADDING_BOTTOM_PX -
    pageFooterHeight -
    A4_PAGE_BREAK_GAP_PX
  );
}

export function minPageStartSpace(maxContent: number): number {
  return maxContent * MIN_PAGE_START_RATIO;
}
