import type { ArticlePageCoordinates } from "../article-page-bindings/types";
import type { Page } from "./types";

export type PageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ModuleCell = {
  col: number;
  row: number;
};

export type ModuleSelection = {
  start: ModuleCell;
  end: ModuleCell;
};

export type PageLayout = {
  pageWidth: number;
  pageHeight: number;
  content: PageRect;
  modules: PageRect[];
  modulesX: number;
  modulesY: number;
  moduleGapX: number;
  moduleGapY: number;
};

function nonNegative(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return value;
}

function positive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

/** Build page content area and module rectangles in page units. */
export function buildPageLayout(page: Page): PageLayout {
  const pageWidth = positive(page.width, 1);
  const pageHeight = positive(page.height, 1);
  const modulesX = Math.max(1, Math.floor(positive(page.modulesX, 1)));
  const modulesY = Math.max(1, Math.floor(positive(page.modulesY, 1)));
  const moduleGapX = nonNegative(page.moduleGapX);
  const moduleGapY = nonNegative(page.moduleGapY);

  const marginTop = nonNegative(page.marginTop);
  const marginRight = nonNegative(page.marginRight);
  const marginBottom = nonNegative(page.marginBottom);
  const marginLeft = nonNegative(page.marginLeft);

  const contentX = Math.min(marginLeft, pageWidth);
  const contentY = Math.min(marginTop, pageHeight);
  const contentWidth = Math.max(0, pageWidth - marginLeft - marginRight);
  const contentHeight = Math.max(0, pageHeight - marginTop - marginBottom);

  const totalGapX = moduleGapX * Math.max(0, modulesX - 1);
  const totalGapY = moduleGapY * Math.max(0, modulesY - 1);
  const moduleWidth =
    modulesX > 0 ? Math.max(0, (contentWidth - totalGapX) / modulesX) : 0;
  const moduleHeight =
    modulesY > 0 ? Math.max(0, (contentHeight - totalGapY) / modulesY) : 0;

  const modules: PageRect[] = [];
  for (let row = 0; row < modulesY; row += 1) {
    for (let col = 0; col < modulesX; col += 1) {
      modules.push({
        x: contentX + col * (moduleWidth + moduleGapX),
        y: contentY + row * (moduleHeight + moduleGapY),
        width: moduleWidth,
        height: moduleHeight,
      });
    }
  }

  return {
    pageWidth,
    pageHeight,
    content: {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
    },
    modules,
    modulesX,
    modulesY,
    moduleGapX,
    moduleGapY,
  };
}

/** Scale so the page fits inside the available viewport with padding. */
export function scaleToFit(
  pageWidth: number,
  pageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 24,
): number {
  const availableW = Math.max(1, viewportWidth - padding * 2);
  const availableH = Math.max(1, viewportHeight - padding * 2);
  const w = positive(pageWidth, 1);
  const h = positive(pageHeight, 1);
  return Math.min(availableW / w, availableH / h);
}

export function sortPages(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    const aSort = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bSort = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (aSort !== bSort) return aSort - bSort;
    return a.id.localeCompare(b.id);
  });
}

export function moduleIndex(col: number, row: number, modulesX: number) {
  return row * modulesX + col;
}

export function moduleCellFromIndex(
  index: number,
  modulesX: number,
): ModuleCell {
  return {
    col: index % modulesX,
    row: Math.floor(index / modulesX),
  };
}

export function normalizeModuleSelection(selection: ModuleSelection) {
  return {
    minCol: Math.min(selection.start.col, selection.end.col),
    maxCol: Math.max(selection.start.col, selection.end.col),
    minRow: Math.min(selection.start.row, selection.end.row),
    maxRow: Math.max(selection.start.row, selection.end.row),
  };
}

export function isModuleSelected(
  col: number,
  row: number,
  selection: ModuleSelection | null,
) {
  if (!selection) return false;
  const bounds = normalizeModuleSelection(selection);
  return (
    col >= bounds.minCol &&
    col <= bounds.maxCol &&
    row >= bounds.minRow &&
    row <= bounds.maxRow
  );
}

/** Bounding box of selected modules in page units (active area). */
export function coordinatesFromModuleSelection(
  layout: PageLayout,
  selection: ModuleSelection,
): ArticlePageCoordinates | null {
  const bounds = normalizeModuleSelection(selection);
  const modules: PageRect[] = [];

  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      const module = layout.modules[moduleIndex(col, row, layout.modulesX)];
      if (module) modules.push(module);
    }
  }

  if (modules.length === 0) return null;

  const x1 = Math.min(...modules.map((module) => module.x));
  const y1 = Math.min(...modules.map((module) => module.y));
  const x2 = Math.max(...modules.map((module) => module.x + module.width));
  const y2 = Math.max(...modules.map((module) => module.y + module.height));

  return { x1, y1, x2, y2 };
}

export function rectFromCoordinates(
  coordinates: ArticlePageCoordinates,
): PageRect {
  const x1 = Math.min(coordinates.x1, coordinates.x2);
  const y1 = Math.min(coordinates.y1, coordinates.y2);
  const x2 = Math.max(coordinates.x1, coordinates.x2);
  const y2 = Math.max(coordinates.y1, coordinates.y2);
  return {
    x: x1,
    y: y1,
    width: Math.max(0, x2 - x1),
    height: Math.max(0, y2 - y1),
  };
}

/** Find module cell under page-unit point, or null when outside modules. */
export function moduleCellAtPoint(
  layout: PageLayout,
  x: number,
  y: number,
): ModuleCell | null {
  for (let index = 0; index < layout.modules.length; index += 1) {
    const module = layout.modules[index];
    if (
      x >= module.x &&
      x <= module.x + module.width &&
      y >= module.y &&
      y <= module.y + module.height
    ) {
      return moduleCellFromIndex(index, layout.modulesX);
    }
  }
  return null;
}

/** Nearest module cell to a page-unit point (useful over gaps/margins while dragging). */
export function nearestModuleCell(
  layout: PageLayout,
  x: number,
  y: number,
): ModuleCell | null {
  if (layout.modules.length === 0) return null;
  const direct = moduleCellAtPoint(layout, x, y);
  if (direct) return direct;

  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < layout.modules.length; index += 1) {
    const module = layout.modules[index];
    const cx = module.x + module.width / 2;
    const cy = module.y + module.height / 2;
    const distance = (cx - x) ** 2 + (cy - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return moduleCellFromIndex(bestIndex, layout.modulesX);
}

/**
 * Recover the module range covered by binding coordinates.
 * Uses module centers so gaps between modules still map cleanly.
 */
export function moduleSelectionFromCoordinates(
  layout: PageLayout,
  coordinates: ArticlePageCoordinates,
): ModuleSelection | null {
  const rect = rectFromCoordinates(coordinates);
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let found = false;

  for (let index = 0; index < layout.modules.length; index += 1) {
    const module = layout.modules[index];
    const cx = module.x + module.width / 2;
    const cy = module.y + module.height / 2;
    if (
      cx >= rect.x &&
      cx <= rect.x + rect.width &&
      cy >= rect.y &&
      cy <= rect.y + rect.height
    ) {
      const cell = moduleCellFromIndex(index, layout.modulesX);
      minCol = Math.min(minCol, cell.col);
      maxCol = Math.max(maxCol, cell.col);
      minRow = Math.min(minRow, cell.row);
      maxRow = Math.max(maxRow, cell.row);
      found = true;
    }
  }

  if (!found) return null;
  return {
    start: { col: minCol, row: minRow },
    end: { col: maxCol, row: maxRow },
  };
}

/** Translate a module selection by cell deltas, clamped to the grid. */
export function moveModuleSelection(
  layout: PageLayout,
  selection: ModuleSelection,
  deltaCol: number,
  deltaRow: number,
): ModuleSelection {
  const bounds = normalizeModuleSelection(selection);
  const width = bounds.maxCol - bounds.minCol;
  const height = bounds.maxRow - bounds.minRow;
  const minCol = Math.max(
    0,
    Math.min(bounds.minCol + deltaCol, layout.modulesX - 1 - width),
  );
  const minRow = Math.max(
    0,
    Math.min(bounds.minRow + deltaRow, layout.modulesY - 1 - height),
  );
  return {
    start: { col: minCol, row: minRow },
    end: { col: minCol + width, row: minRow + height },
  };
}

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** Resize a module selection by snapping the active edge(s) to a target cell. */
export function resizeModuleSelection(
  layout: PageLayout,
  selection: ModuleSelection,
  handle: ResizeHandle,
  target: ModuleCell,
): ModuleSelection {
  const bounds = normalizeModuleSelection(selection);
  let minCol = bounds.minCol;
  let maxCol = bounds.maxCol;
  let minRow = bounds.minRow;
  let maxRow = bounds.maxRow;

  const col = Math.max(0, Math.min(target.col, layout.modulesX - 1));
  const row = Math.max(0, Math.min(target.row, layout.modulesY - 1));

  if (handle.includes("e")) maxCol = col;
  if (handle.includes("w")) minCol = col;
  if (handle.includes("s")) maxRow = row;
  if (handle.includes("n")) minRow = row;

  if (minCol > maxCol) {
    const swap = minCol;
    minCol = maxCol;
    maxCol = swap;
  }
  if (minRow > maxRow) {
    const swap = minRow;
    minRow = maxRow;
    maxRow = swap;
  }

  return {
    start: { col: minCol, row: minRow },
    end: { col: maxCol, row: maxRow },
  };
}

export function moduleSelectionsEqual(
  a: ModuleSelection | null,
  b: ModuleSelection | null,
) {
  if (a === b) return true;
  if (!a || !b) return false;
  const left = normalizeModuleSelection(a);
  const right = normalizeModuleSelection(b);
  return (
    left.minCol === right.minCol &&
    left.maxCol === right.maxCol &&
    left.minRow === right.minRow &&
    left.maxRow === right.maxRow
  );
}
