"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  createArticleAndBindAction,
  createArticlePageBindingAction,
  deleteArticlePageBindingAction,
  updateArticlePageBindingAction,
} from "@/app/actions/article-page-bindings";
import type {
  ArticlePageBinding,
  ArticlePageCoordinates,
} from "@/lib/article-page-bindings/types";
import type { Article } from "@/lib/articles/types";
import {
  buildPageLayout,
  coordinatesFromModuleSelection,
  isModuleSelected,
  moduleCellAtPoint,
  moduleCellFromIndex,
  moduleSelectionFromCoordinates,
  moduleSelectionsEqual,
  moveModuleSelection,
  nearestModuleCell,
  normalizeModuleSelection,
  rectFromCoordinates,
  resizeModuleSelection,
  scaleToFit,
  sortPages,
  type ModuleSelection,
  type ResizeHandle,
} from "@/lib/pages/geometry";
import {
  PAGE_SIDE_LABELS,
  PAGE_UNIT_LABELS,
  type Page,
} from "@/lib/pages/types";
import type { Section } from "@/lib/sections/types";
import Link from "../Link";
import ArticleBindingPanel, {
  bindingColor,
  type NewArticleDraft,
} from "./ArticleBindingPanel";

const PAPER = "#f7f4ef";
const PAPER_EDGE = "#cfc7bb";
const MARGIN_FILL = "rgba(120, 110, 95, 0.06)";
const GAP_FILL = "#e8e2d8";
const MODULE_FILL = "#ffffff";
const MODULE_STROKE = "#9a9184";
const CONTENT_STROKE = "#b7aea0";
const SELECTION_FILL = "rgba(30, 90, 75, 0.28)";
const SELECTION_STROKE = "#1e5a4b";
const HANDLE_FILL = "#1e5a4b";

type BindingEditMode =
  | { type: "move"; origin: { col: number; row: number } }
  | { type: "resize"; handle: ResizeHandle };

type BindingEditState = {
  bindingId: string;
  pointerId: number;
  baseSelection: ModuleSelection;
  draftSelection: ModuleSelection;
  mode: BindingEditMode;
};

const RESIZE_HANDLES: ResizeHandle[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];

function cursorForHandle(handle: ResizeHandle) {
  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
  }
}

function coordinatesEqual(
  a: ArticlePageCoordinates,
  b: ArticlePageCoordinates,
) {
  return (
    a.x1 === b.x1 && a.y1 === b.y1 && a.x2 === b.x2 && a.y2 === b.y2
  );
}

export default function PagePreview({
  section,
  pages,
  currentPage,
  articles,
  bindings,
}: {
  section: Pick<Section, "id" | "name">;
  pages: Page[];
  currentPage: Page;
  articles: Article[];
  bindings: ArticlePageBinding[];
}) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectionRef = useRef<ModuleSelection | null>(null);
  const bindingEditRef = useRef<BindingEditState | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 700 });
  const [selection, setSelection] = useState<ModuleSelection | null>(null);
  const [dragging, setDragging] = useState(false);
  const [bindingEdit, setBindingEdit] = useState<BindingEditState | null>(null);
  const [focusedBindingId, setFocusedBindingId] = useState<string | null>(null);
  const [coordinateOverrides, setCoordinateOverrides] = useState<
    Record<string, ArticlePageCoordinates>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateSelection = useCallback((next: ModuleSelection | null) => {
    selectionRef.current = next;
    setSelection(next);
  }, []);

  const updateBindingEdit = useCallback((next: BindingEditState | null) => {
    bindingEditRef.current = next;
    setBindingEdit(next);
  }, []);

  const orderedPages = useMemo(() => sortPages(pages), [pages]);
  const currentIndex = orderedPages.findIndex((p) => p.id === currentPage.id);
  const prevPage = currentIndex > 0 ? orderedPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex >= 0 && currentIndex < orderedPages.length - 1
      ? orderedPages[currentIndex + 1]
      : null;

  const layout = useMemo(() => buildPageLayout(currentPage), [currentPage]);
  const scale = scaleToFit(
    layout.pageWidth,
    layout.pageHeight,
    viewportSize.width,
    viewportSize.height,
    32,
  );
  const displayWidth = layout.pageWidth * scale;
  const displayHeight = layout.pageHeight * scale;

  const articleById = useMemo(
    () => new Map(articles.map((article) => [article.id, article])),
    [articles],
  );

  const bindingById = useMemo(
    () => new Map(bindings.map((binding) => [binding.id, binding])),
    [bindings],
  );

  const bindingCoordinates = useCallback(
    (binding: ArticlePageBinding) =>
      coordinateOverrides[binding.id] ?? binding.coordinates,
    [coordinateOverrides],
  );

  useEffect(() => {
    updateSelection(null);
    updateBindingEdit(null);
    setCoordinateOverrides({});
    setFocusedBindingId(null);
    setError(null);
  }, [currentPage.id, updateBindingEdit, updateSelection]);

  // Drop optimistic overrides once server props catch up.
  useEffect(() => {
    setCoordinateOverrides((prev) => {
      const ids = Object.keys(prev);
      if (ids.length === 0) return prev;

      let changed = false;
      const next = { ...prev };
      for (const id of ids) {
        const binding = bindingById.get(id);
        if (!binding) {
          delete next[id];
          changed = true;
          continue;
        }
        const serverSelection = moduleSelectionFromCoordinates(
          layout,
          binding.coordinates,
        );
        const overrideSelection = moduleSelectionFromCoordinates(
          layout,
          prev[id],
        );
        if (
          coordinatesEqual(binding.coordinates, prev[id]) ||
          moduleSelectionsEqual(serverSelection, overrideSelection)
        ) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [bindingById, bindings, layout]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setViewportSize({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (page: Page | null) => {
      if (!page) return;
      router.push(`/sections/${section.id}/pages/${page.id}`);
    },
    [router, section.id],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        updateSelection(null);
        updateBindingEdit(null);
        setFocusedBindingId(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(prevPage);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(nextPage);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, nextPage, prevPage, updateBindingEdit, updateSelection]);

  const clientToPagePoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * layout.pageWidth,
        y: ((clientY - rect.top) / rect.height) * layout.pageHeight,
      };
    },
    [layout.pageHeight, layout.pageWidth],
  );

  const pointToModuleCell = useCallback(
    (clientX: number, clientY: number) => {
      const point = clientToPagePoint(clientX, clientY);
      if (!point) return null;
      return moduleCellAtPoint(layout, point.x, point.y);
    },
    [clientToPagePoint, layout],
  );

  const focusBinding = useCallback(
    (bindingId: string) => {
      updateSelection(null);
      setFocusedBindingId(bindingId);
      setError(null);
    },
    [updateSelection],
  );

  const saveBindingSelection = useCallback(
    (bindingId: string, nextSelection: ModuleSelection) => {
      const binding = bindingById.get(bindingId);
      if (!binding) return;

      const currentCoordinates =
        coordinateOverrides[bindingId] ?? binding.coordinates;
      const original = moduleSelectionFromCoordinates(
        layout,
        currentCoordinates,
      );
      if (moduleSelectionsEqual(original, nextSelection)) return;

      const coordinates = coordinatesFromModuleSelection(layout, nextSelection);
      if (!coordinates) {
        setError("Nie udało się wyznaczyć obszaru aktywnego.");
        return;
      }

      setError(null);
      // Keep the new geometry visible while the server action + refresh catch up.
      setCoordinateOverrides((prev) => ({ ...prev, [bindingId]: coordinates }));
      startTransition(async () => {
        const result = await updateArticlePageBindingAction({
          id: binding.id,
          articleId: binding.articleId,
          pageId: currentPage.id,
          sectionId: section.id,
          coordinates,
        });
        if (result?.error) {
          setCoordinateOverrides((prev) => {
            const next = { ...prev };
            delete next[bindingId];
            return next;
          });
          setError(result.error);
          return;
        }
        router.refresh();
      });
    },
    [
      bindingById,
      coordinateOverrides,
      currentPage.id,
      layout,
      router,
      section.id,
    ],
  );

  const beginBindingEdit = (
    event: ReactPointerEvent,
    bindingId: string,
    mode: BindingEditMode,
  ) => {
    const binding = bindingById.get(bindingId);
    if (!binding) return;
    const baseSelection = moduleSelectionFromCoordinates(
      layout,
      bindingCoordinates(binding),
    );
    if (!baseSelection) {
      setError("Nie udało się odczytać siatki powiązania.");
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    focusBinding(bindingId);
    updateBindingEdit({
      bindingId,
      pointerId: event.pointerId,
      baseSelection,
      draftSelection: baseSelection,
      mode,
    });
  };

  const handleBindingPointerMove = (event: ReactPointerEvent) => {
    const edit = bindingEditRef.current;
    if (!edit || edit.pointerId !== event.pointerId) return;

    const point = clientToPagePoint(event.clientX, event.clientY);
    if (!point) return;
    const cell = nearestModuleCell(layout, point.x, point.y);
    if (!cell) return;

    let nextSelection: ModuleSelection;
    if (edit.mode.type === "move") {
      nextSelection = moveModuleSelection(
        layout,
        edit.baseSelection,
        cell.col - edit.mode.origin.col,
        cell.row - edit.mode.origin.row,
      );
    } else {
      nextSelection = resizeModuleSelection(
        layout,
        edit.baseSelection,
        edit.mode.handle,
        cell,
      );
    }

    if (moduleSelectionsEqual(edit.draftSelection, nextSelection)) return;
    updateBindingEdit({ ...edit, draftSelection: nextSelection });
  };

  const endBindingEdit = (event: ReactPointerEvent) => {
    const edit = bindingEditRef.current;
    if (!edit || edit.pointerId !== event.pointerId) return;

    const draft = edit.draftSelection;
    const bindingId = edit.bindingId;
    // Optimistic coords first, then clear draft (batched) — avoids a flash
    // back to the previous server geometry while the action refreshes.
    saveBindingSelection(bindingId, draft);
    updateBindingEdit(null);
    try {
      (event.currentTarget as Element).releasePointerCapture?.(event.pointerId);
    } catch {
      // already released
    }
  };

  const handleSvgPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || bindingEditRef.current) return;
    const cell = pointToModuleCell(event.clientX, event.clientY);
    if (!cell) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setFocusedBindingId(null);
    setDragging(true);
    updateSelection({ start: cell, end: cell });
  };

  const handleSvgPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (bindingEditRef.current?.pointerId === event.pointerId) {
      handleBindingPointerMove(event);
      return;
    }
    if (!dragging) return;
    const current = selectionRef.current;
    if (!current) return;
    const cell = pointToModuleCell(event.clientX, event.clientY);
    if (!cell) return;
    updateSelection({ start: current.start, end: cell });
  };

  const handleSvgPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (bindingEditRef.current?.pointerId === event.pointerId) {
      endBindingEdit(event);
      return;
    }
    if (!dragging) return;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  };

  const resolveSelectionCoordinates = () => {
    if (!selection) {
      setError("Najpierw zaznacz moduły na stronie.");
      return null;
    }

    const coordinates = coordinatesFromModuleSelection(layout, selection);
    if (!coordinates) {
      setError("Nie udało się wyznaczyć obszaru aktywnego.");
      return null;
    }

    return coordinates;
  };

  const bindArticle = (articleId: string) => {
    const coordinates = resolveSelectionCoordinates();
    if (!coordinates) return;

    setError(null);
    startTransition(async () => {
      const result = await createArticlePageBindingAction({
        articleId,
        pageId: currentPage.id,
        sectionId: section.id,
        coordinates,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      updateSelection(null);
      router.refresh();
    });
  };

  const createAndBindArticle = (draft: NewArticleDraft) => {
    const coordinates = resolveSelectionCoordinates();
    if (!coordinates) return Promise.resolve(false);

    setError(null);
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const result = await createArticleAndBindAction({
          title: draft.title,
          kicker: draft.kicker,
          byline: draft.byline,
          pageId: currentPage.id,
          sectionId: section.id,
          coordinates,
        });
        if (result?.error) {
          setError(result.error);
          resolve(false);
          return;
        }
        updateSelection(null);
        router.refresh();
        resolve(true);
      });
    });
  };

  const removeBinding = (bindingId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteArticlePageBindingAction({
        id: bindingId,
        pageId: currentPage.id,
        sectionId: section.id,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (focusedBindingId === bindingId) {
        setFocusedBindingId(null);
      }
      router.refresh();
    });
  };

  const pageLabel = currentPage.name?.trim()
    ? currentPage.name
    : `Strona ${currentPage.pageNumber}`;
  const unitLabel = currentPage.unit
    ? PAGE_UNIT_LABELS[currentPage.unit]
    : null;
  const sideLabel = currentPage.pageSide
    ? PAGE_SIDE_LABELS[currentPage.pageSide]
    : null;
  const strokeWidth = layout.pageWidth * 0.0012;
  const labelFontSize = Math.max(layout.pageWidth * 0.028, 2.4);
  const labelPadX = labelFontSize * 0.45;
  const labelPadY = labelFontSize * 0.35;
  const labelLineHeight = labelFontSize * 1.25;
  const handleSize = Math.max(layout.pageWidth * 0.018, 1.6);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 48px)",
        minHeight: 520,
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Tooltip title="Wróć do grzbietu">
            <IconButton
              component={Link}
              href={`/sections/${section.id}/edit`}
              aria-label="Wróć do grzbietu"
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="h1" noWrap>
              {section.name}
            </Typography>
            <Typography color="text.secondary" variant="body2" noWrap>
              {pageLabel}
              {sideLabel ? ` · ${sideLabel}` : ""}
              {` · ${currentPage.width} × ${currentPage.height}`}
              {unitLabel ? ` ${unitLabel}` : ""}
              {` · siatka ${layout.modulesX} × ${layout.modulesY}`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Poprzednia strona">
            <span>
              <IconButton
                aria-label="Poprzednia strona"
                onClick={() => goTo(prevPage)}
                disabled={!prevPage}
              >
                <ChevronLeftIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography
            variant="body1"
            sx={{ minWidth: 88, textAlign: "center", fontWeight: 600 }}
          >
            {currentIndex >= 0 ? currentIndex + 1 : "—"} / {orderedPages.length}
          </Typography>
          <Tooltip title="Następna strona">
            <span>
              <IconButton
                aria-label="Następna strona"
                onClick={() => goTo(nextPage)}
                disabled={!nextPage}
              >
                <ChevronRightIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            bgcolor: "grey.100",
            display: "flex",
          }}
        >
          <Box
            ref={viewportRef}
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
              userSelect: "none",
              touchAction: "none",
            }}
          >
            <Box
              sx={{
                width: displayWidth,
                height: displayHeight,
                boxShadow: "0 12px 40px rgba(40, 32, 20, 0.18)",
                borderRadius: 0.5,
                overflow: "hidden",
                bgcolor: PAPER,
                border: `1px solid ${PAPER_EDGE}`,
              }}
            >
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${layout.pageWidth} ${layout.pageHeight}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`Podgląd strony ${currentPage.pageNumber}: zaznacz moduły lub przeciągnij powiązanie`}
                style={{ cursor: "crosshair", touchAction: "none" }}
                onPointerDown={handleSvgPointerDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerCancel={handleSvgPointerUp}
              >
                <rect
                  x={0}
                  y={0}
                  width={layout.pageWidth}
                  height={layout.pageHeight}
                  fill={PAPER}
                />
                <rect
                  x={layout.content.x}
                  y={layout.content.y}
                  width={layout.content.width}
                  height={layout.content.height}
                  fill={MARGIN_FILL}
                  stroke={CONTENT_STROKE}
                  strokeWidth={layout.pageWidth * 0.0015}
                />
                {layout.content.width > 0 && layout.content.height > 0 ? (
                  <rect
                    x={layout.content.x}
                    y={layout.content.y}
                    width={layout.content.width}
                    height={layout.content.height}
                    fill={GAP_FILL}
                  />
                ) : null}

                {layout.modules.map((module, index) => {
                  const cell = moduleCellFromIndex(index, layout.modulesX);
                  const selected = isModuleSelected(
                    cell.col,
                    cell.row,
                    selection,
                  );
                  return (
                    <rect
                      key={`${index}-${module.x}-${module.y}`}
                      x={module.x}
                      y={module.y}
                      width={module.width}
                      height={module.height}
                      fill={selected ? SELECTION_FILL : MODULE_FILL}
                      stroke={selected ? SELECTION_STROKE : MODULE_STROKE}
                      strokeWidth={selected ? strokeWidth * 1.6 : strokeWidth}
                      style={{ pointerEvents: "none" }}
                    />
                  );
                })}

                {bindings.map((binding, index) => {
                  const sourceCoordinates = bindingCoordinates(binding);
                  const edit =
                    bindingEdit?.bindingId === binding.id
                      ? bindingEdit.draftSelection
                      : null;
                  const displaySelection =
                    edit ??
                    moduleSelectionFromCoordinates(layout, sourceCoordinates);
                  const coordinates = displaySelection
                    ? coordinatesFromModuleSelection(layout, displaySelection)
                    : sourceCoordinates;
                  if (!coordinates) return null;

                  const rect = rectFromCoordinates(coordinates);
                  const article = articleById.get(binding.articleId);
                  const focused = focusedBindingId === binding.id;
                  const fill = bindingColor(index);
                  const rawTitle = article?.title?.trim() || "Artykuł";
                  const maxChars = Math.max(
                    8,
                    Math.floor(
                      (rect.width - labelPadX * 2) / (labelFontSize * 0.55),
                    ),
                  );
                  const title =
                    rawTitle.length > maxChars
                      ? `${rawTitle.slice(0, Math.max(1, maxChars - 1))}…`
                      : rawTitle;
                  const labelWidth = Math.min(
                    rect.width - labelPadX * 0.5,
                    title.length * labelFontSize * 0.58 + labelPadX * 2,
                  );
                  const labelHeight = labelLineHeight + labelPadY * 2;
                  const labelX = rect.x + labelPadX * 0.5;
                  const labelY = rect.y + labelPadY * 0.5;
                  const bounds = displaySelection
                    ? normalizeModuleSelection(displaySelection)
                    : null;

                  return (
                    <g key={binding.id}>
                      <rect
                        x={rect.x}
                        y={rect.y}
                        width={rect.width}
                        height={rect.height}
                        fill={fill}
                        stroke={
                          focused ? SELECTION_STROKE : "rgba(40,32,20,0.45)"
                        }
                        strokeWidth={focused ? strokeWidth * 2 : strokeWidth}
                        style={{ cursor: focused ? "move" : "pointer" }}
                        onPointerDown={(event) => {
                          if (event.button !== 0) return;
                          const cell = pointToModuleCell(
                            event.clientX,
                            event.clientY,
                          );
                          if (!cell || !bounds) {
                            focusBinding(binding.id);
                            event.stopPropagation();
                            return;
                          }
                          beginBindingEdit(event, binding.id, {
                            type: "move",
                            origin: {
                              col: cell.col,
                              row: cell.row,
                            },
                          });
                        }}
                        onPointerMove={handleBindingPointerMove}
                        onPointerUp={endBindingEdit}
                        onPointerCancel={endBindingEdit}
                      />
                      {rect.width > 0 && rect.height > 0 ? (
                        <g style={{ pointerEvents: "none" }}>
                          <rect
                            x={labelX}
                            y={labelY}
                            width={Math.max(labelWidth, labelFontSize * 2)}
                            height={Math.min(
                              labelHeight,
                              rect.height - labelPadY,
                            )}
                            rx={labelFontSize * 0.2}
                            ry={labelFontSize * 0.2}
                            fill="rgba(255, 252, 247, 0.94)"
                            stroke="rgba(40, 32, 20, 0.28)"
                            strokeWidth={strokeWidth * 0.8}
                          />
                          <text
                            x={labelX + labelPadX}
                            y={labelY + labelPadY + labelFontSize * 0.9}
                            fontSize={labelFontSize}
                            fontWeight={700}
                            fill="#1a1814"
                          >
                            {title}
                          </text>
                        </g>
                      ) : null}

                      {focused
                        ? RESIZE_HANDLES.map((handle) => {
                            const onLeft = handle.includes("w");
                            const onRight = handle.includes("e");
                            const onTop = handle.includes("n");
                            const onBottom = handle.includes("s");
                            const cx = onLeft
                              ? rect.x
                              : onRight
                                ? rect.x + rect.width
                                : rect.x + rect.width / 2;
                            const cy = onTop
                              ? rect.y
                              : onBottom
                                ? rect.y + rect.height
                                : rect.y + rect.height / 2;
                            return (
                              <rect
                                key={handle}
                                x={cx - handleSize / 2}
                                y={cy - handleSize / 2}
                                width={handleSize}
                                height={handleSize}
                                fill={HANDLE_FILL}
                                stroke="#fff"
                                strokeWidth={strokeWidth * 0.8}
                                style={{ cursor: cursorForHandle(handle) }}
                                onPointerDown={(event) => {
                                  if (event.button !== 0) return;
                                  beginBindingEdit(event, binding.id, {
                                    type: "resize",
                                    handle,
                                  });
                                }}
                                onPointerMove={handleBindingPointerMove}
                                onPointerUp={endBindingEdit}
                                onPointerCancel={endBindingEdit}
                              />
                            );
                          })
                        : null}
                    </g>
                  );
                })}
              </svg>
            </Box>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            flexShrink: 0,
            width: { xs: "100%", md: 352 },
            minHeight: { xs: 320, md: 0 },
            overflow: "hidden",
          }}
        >
          <ArticleBindingPanel
            articles={articles}
            bindings={bindings}
            articleById={articleById}
            sectionId={section.id}
            pageId={currentPage.id}
            hasSelection={Boolean(selection)}
            pending={isPending}
            error={error}
            onBindArticle={bindArticle}
            onCreateArticle={createAndBindArticle}
            onDeleteBinding={removeBinding}
            onFocusBinding={focusBinding}
          />
        </Paper>
      </Box>
    </Box>
  );
}
