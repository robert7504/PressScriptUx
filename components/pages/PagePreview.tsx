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
} from "@/app/actions/article-page-bindings";
import type { ArticlePageBinding } from "@/lib/article-page-bindings/types";
import type { Article } from "@/lib/articles/types";
import {
  buildPageLayout,
  coordinatesFromModuleSelection,
  isModuleSelected,
  moduleCellAtPoint,
  moduleCellFromIndex,
  rectFromCoordinates,
  scaleToFit,
  sortPages,
  type ModuleSelection,
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
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 700 });
  const [selection, setSelection] = useState<ModuleSelection | null>(null);
  const [dragging, setDragging] = useState(false);
  const [focusedBindingId, setFocusedBindingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateSelection = useCallback((next: ModuleSelection | null) => {
    selectionRef.current = next;
    setSelection(next);
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

  useEffect(() => {
    updateSelection(null);
    setFocusedBindingId(null);
    setError(null);
  }, [currentPage.id, updateSelection]);

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
  }, [goTo, nextPage, prevPage, updateSelection]);

  const pointToModuleCell = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const x = ((clientX - rect.left) / rect.width) * layout.pageWidth;
      const y = ((clientY - rect.top) / rect.height) * layout.pageHeight;
      return moduleCellAtPoint(layout, x, y);
    },
    [layout],
  );

  const handleSvgPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    const cell = pointToModuleCell(event.clientX, event.clientY);
    if (!cell) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setFocusedBindingId(null);
    setDragging(true);
    updateSelection({ start: cell, end: cell });
  };

  const handleSvgPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const current = selectionRef.current;
    if (!current) return;
    const cell = pointToModuleCell(event.clientX, event.clientY);
    if (!cell) return;
    updateSelection({ start: current.start, end: cell });
  };

  const handleSvgPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
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
                aria-label={`Podgląd strony ${currentPage.pageNumber}: zaznacz moduły, aby powiązać artykuł`}
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
                  const rect = rectFromCoordinates(binding.coordinates);
                  const article = articleById.get(binding.articleId);
                  const focused = focusedBindingId === binding.id;
                  const fill = bindingColor(index);
                  const rawTitle = article?.title?.trim() || "Artykuł";
                  const maxChars = Math.max(
                    8,
                    Math.floor((rect.width - labelPadX * 2) / (labelFontSize * 0.55)),
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
                  return (
                    <g key={binding.id} style={{ pointerEvents: "none" }}>
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
                      />
                      {rect.width > 0 && rect.height > 0 ? (
                        <g>
                          <rect
                            x={labelX}
                            y={labelY}
                            width={Math.max(labelWidth, labelFontSize * 2)}
                            height={Math.min(labelHeight, rect.height - labelPadY)}
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
            onFocusBinding={setFocusedBindingId}
          />
        </Paper>
      </Box>
    </Box>
  );
}
