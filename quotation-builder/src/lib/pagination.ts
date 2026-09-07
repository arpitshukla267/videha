import { contentBudget } from "./a4";
import {
  paginateTableRows,
  type RowMeta,
  type RowSegment,
  tableSliceHeight,
} from "./row-segments";

export type QuotationMeasuredHeights = {
  header: number;
  client: number;
  thead: number;
  rows: Record<string, number>;
  rowMeta: Record<string, RowMeta>;
  totals: number;
  terms: number;
  thanks: number;
  contact: number;
  pageFooter: number;
};

export type QuotationPagePlan = {
  pageIndex: number;
  showHeader: boolean;
  showClient: boolean;
  rowSegments: RowSegment[];
  pageBreakAfterSegmentKeys: string[];
  showTotals: boolean;
  showTerms: boolean;
  showThanks: boolean;
  showContact: boolean;
};

function createPage(pageIndex: number): QuotationPagePlan {
  return {
    pageIndex,
    showHeader: pageIndex === 0,
    showClient: pageIndex === 0,
    rowSegments: [],
    pageBreakAfterSegmentKeys: [],
    showTotals: false,
    showTerms: false,
    showThanks: false,
    showContact: false,
  };
}

export function paginateQuotation(
  itemIds: string[],
  heights: QuotationMeasuredHeights,
  trailing: {
    hasTerms: boolean;
    hasThanks: boolean;
    hasContact: boolean;
  },
): QuotationPagePlan[] {
  const maxContent = contentBudget(heights.pageFooter || 100);
  const pages: QuotationPagePlan[] = [];

  const firstPageHeaderUsed = heights.header + heights.client;

  const { slices, finalUsed: tableEndUsed } =
    itemIds.length > 0
      ? paginateTableRows(itemIds, heights.rowMeta, heights.thead, maxContent, firstPageHeaderUsed)
      : { slices: [] as ReturnType<typeof paginateTableRows>["slices"], finalUsed: firstPageHeaderUsed };

  if (itemIds.length === 0) {
    pages.push(createPage(0));
  } else {
    slices.forEach((slice, index) => {
      const page = createPage(index);
      page.rowSegments = slice.segments;
      page.pageBreakAfterSegmentKeys = slice.pageBreakAfterSegmentKeys;
      pages.push(page);
    });
  }

  let lastPage = pages[pages.length - 1] ?? createPage(0);
  if (!pages.length) pages.push(lastPage);

  let lastUsed =
    pages.length === 1 && itemIds.length > 0
      ? tableEndUsed
      : measurePageUsed(lastPage, heights);

  if (lastUsed + heights.totals > maxContent) {
    lastPage = createPage(pages.length);
    pages.push(lastPage);
    lastUsed = 0;
  }
  lastPage.showTotals = true;
  lastUsed += heights.totals;

  const closingBlocks: Array<{
    key: "showTerms" | "showThanks" | "showContact";
    height: number;
    enabled: boolean;
  }> = [
    { key: "showTerms", height: heights.terms, enabled: trailing.hasTerms },
    { key: "showThanks", height: heights.thanks, enabled: trailing.hasThanks },
    { key: "showContact", height: heights.contact, enabled: trailing.hasContact },
  ];

  const closingHeight = closingBlocks
    .filter((block) => block.enabled)
    .reduce((sum, block) => sum + block.height, 0);

  if (closingHeight > 0 && lastUsed + closingHeight > maxContent) {
    lastPage = createPage(pages.length);
    pages.push(lastPage);
    lastUsed = 0;
  }

  for (const block of closingBlocks) {
    if (!block.enabled) continue;
    lastPage[block.key] = true;
    lastUsed += block.height;
  }

  return pages;
}

function measurePageUsed(page: QuotationPagePlan, heights: QuotationMeasuredHeights): number {
  let used = 0;
  if (page.showHeader) used += heights.header;
  if (page.showClient) used += heights.client;
  if (page.rowSegments.length > 0) {
    used += tableSliceHeight(
      { segments: page.rowSegments, pageBreakAfterSegmentKeys: page.pageBreakAfterSegmentKeys },
      heights.rowMeta,
      heights.thead,
    );
  }
  if (page.showTotals) used += heights.totals;
  if (page.showTerms) used += heights.terms;
  if (page.showThanks) used += heights.thanks;
  if (page.showContact) used += heights.contact;
  return used;
}
