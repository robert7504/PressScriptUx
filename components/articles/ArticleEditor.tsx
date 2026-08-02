"use client";

import CodeIcon from "@mui/icons-material/Code";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type QuillType from "quill";
import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";
import { getParagraphStylesForMagazineAction } from "@/app/actions/paragraph-styles";
import {
  PARAGRAPH_STYLE_FORMAT,
  buildParagraphStylePickerCss,
  buildParagraphStylePreviewCss,
  htmlTagToQuillFormats,
} from "@/lib/paragraph-styles/editor";
import type { ParagraphStyle } from "@/lib/paragraph-styles/types";

const BASE_TOOLBAR = [
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["blockquote", "link"],
  ["clean"],
] as const;

type ArticleEditorProps = {
  name?: string;
  label?: string;
  defaultValue?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  magazineId?: string;
};

function isEmptyHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
}

function registerParagraphStyleAttributor(
  Quill: typeof QuillType,
  cssClasses: string[],
) {
  const Parchment = Quill.import("parchment") as typeof import("parchment");

  class ParagraphStyleAttributor extends Parchment.Attributor {
    constructor(whitelist: string[]) {
      super(PARAGRAPH_STYLE_FORMAT, "data-ps", {
        scope: Parchment.Scope.BLOCK,
        whitelist,
      });
    }

    add(node: HTMLElement, value: string) {
      if (!this.canAdd(node, value)) return false;
      this.remove(node);
      node.setAttribute(this.keyName, value);
      node.classList.add(value);
      return true;
    }

    remove(node: HTMLElement) {
      const previous = node.getAttribute(this.keyName);
      if (previous) {
        node.classList.remove(previous);
      }
      for (const cssClass of this.whitelist ?? []) {
        node.classList.remove(cssClass);
      }
      node.removeAttribute(this.keyName);
    }

    value(node: HTMLElement) {
      const fromData = node.getAttribute(this.keyName) || "";
      if (this.canAdd(node, fromData) && fromData) {
        return fromData;
      }
      for (const cssClass of this.whitelist ?? []) {
        if (node.classList.contains(cssClass)) {
          return cssClass;
        }
      }
      return "";
    }
  }

  Quill.register(new ParagraphStyleAttributor(cssClasses), true);
}

function applyParagraphStyle(
  quill: QuillType,
  style: ParagraphStyle | null,
) {
  if (!style) {
    quill.format(PARAGRAPH_STYLE_FORMAT, false);
    return;
  }

  const formats = htmlTagToQuillFormats(style.htmlTag);
  quill.format("header", formats.header);
  quill.format("blockquote", formats.blockquote);
  quill.format(PARAGRAPH_STYLE_FORMAT, style.cssClass);
}

export default function ArticleEditor({
  name = "content",
  label = "Treść",
  defaultValue = "",
  error = false,
  helperText,
  disabled = false,
  magazineId = "",
}: ArticleEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillType | null>(null);
  const stylesRef = useRef<ParagraphStyle[]>([]);
  const valueRef = useRef(defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState(defaultValue);
  const [styles, setStyles] = useState<ParagraphStyle[]>([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [stylesError, setStylesError] = useState<string | null>(null);
  const [configurationName, setConfigurationName] = useState<string | null>(
    null,
  );

  function applyHtmlToEditor(html: string) {
    const next = isEmptyHtml(html) ? "" : html;
    valueRef.current = next;
    setValue(next);

    const quill = quillRef.current;
    if (!quill) return;

    const current = isEmptyHtml(quill.root.innerHTML)
      ? ""
      : quill.root.innerHTML;
    if (current === next) return;

    const selection = quill.getSelection();
    quill.setContents([]);
    if (next) {
      quill.clipboard.dangerouslyPasteHTML(next);
    }
    if (selection) {
      const length = quill.getLength();
      quill.setSelection(Math.min(selection.index, length - 1), 0);
    }
  }

  function toggleHtmlView() {
    if (showHtml) {
      applyHtmlToEditor(htmlDraft);
      setShowHtml(false);
      return;
    }

    setHtmlDraft(valueRef.current);
    setShowHtml(true);
  }

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    stylesRef.current = styles;
  }, [styles]);

  useEffect(() => {
    let cancelled = false;

    async function loadStyles() {
      if (!magazineId) {
        setStyles([]);
        setStylesError(null);
        setConfigurationName(null);
        setStylesLoading(false);
        return;
      }

      setStylesLoading(true);
      setStylesError(null);
      setConfigurationName(null);
      setStyles([]);

      const result = await getParagraphStylesForMagazineAction(magazineId);
      if (cancelled) return;

      setStyles(result.styles);
      setConfigurationName(result.configurationName);
      setStylesError(result.error ?? null);
      setStylesLoading(false);
    }

    void loadStyles();

    return () => {
      cancelled = true;
    };
  }, [magazineId]);

  const stylesSignature = `${magazineId}::${styles.map((style) => style.id).join(",")}`;

  useEffect(() => {
    let disposed = false;
    const host = hostRef.current;

    async function mountEditor() {
      if (!host) return;

      const { default: Quill } = await import("quill");
      if (disposed || !host) return;

      if (styles.length > 0) {
        registerParagraphStyleAttributor(
          Quill,
          styles.map((style) => style.cssClass),
        );
      }

      host.innerHTML = "";
      const editorHost = document.createElement("div");
      host.appendChild(editorHost);

      const styleValues = styles.map((style) => style.cssClass);
      const toolbarContainer =
        styles.length > 0
          ? [
              [{ [PARAGRAPH_STYLE_FORMAT]: [false, ...styleValues] }],
              ...BASE_TOOLBAR,
            ]
          : [[{ header: [1, 2, 3, false] }], ...BASE_TOOLBAR];

      const quill = new Quill(editorHost, {
        theme: "snow",
        modules: {
          toolbar: {
            container: toolbarContainer,
            handlers: {
              [PARAGRAPH_STYLE_FORMAT](value: string) {
                const toolbar = this as unknown as { quill: QuillType };
                const selected =
                  stylesRef.current.find((style) => style.cssClass === value) ??
                  null;
                applyParagraphStyle(toolbar.quill, value ? selected : null);
              },
            },
          },
        },
        placeholder: "Napisz treść artykułu…",
      });

      const initialHtml = valueRef.current || defaultValue;
      if (initialHtml) {
        quill.clipboard.dangerouslyPasteHTML(initialHtml);
      }

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        const next = isEmptyHtml(html) ? "" : html;
        valueRef.current = next;
        setValue(next);
      });

      quill.enable(!disabled);
      quillRef.current = quill;
      if (!disposed) {
        setReady(true);
      }
    }

    quillRef.current = null;
    void mountEditor();

    return () => {
      disposed = true;
      quillRef.current = null;
      if (host) {
        host.innerHTML = "";
      }
    };
    // Remount when the resolved magazine style set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylesSignature]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.enable(!disabled);
  }, [disabled]);

  const previewCss = buildParagraphStylePreviewCss(styles);
  const pickerCss = buildParagraphStylePickerCss(styles);

  const statusHelper = !magazineId
    ? "Wybierz magazyn, aby załadować style akapitowe z konfiguracji typografii."
    : stylesLoading
      ? "Ładowanie stylów akapitowych…"
      : stylesError
        ? stylesError
        : styles.length === 0
          ? "Brak aktywnych stylów akapitowych w konfiguracji typografii tego magazynu."
          : configurationName
            ? `Style z konfiguracji: ${configurationName}`
            : undefined;

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.75 }}
      >
        <Typography
          variant="body2"
          color={error ? "error" : "text.secondary"}
        >
          {label}
        </Typography>
        <Tooltip title={showHtml ? "Podgląd wizualny" : "Podgląd HTML"}>
          <span>
            <IconButton
              size="small"
              onClick={toggleHtmlView}
              disabled={!ready || disabled}
              aria-label={showHtml ? "Podgląd wizualny" : "Podgląd HTML"}
              aria-pressed={showHtml}
              color={showHtml ? "primary" : "default"}
            >
              {showHtml ? (
                <VisibilityOutlinedIcon fontSize="small" />
              ) : (
                <CodeIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <input type="hidden" name={name} value={value} />
      {styles.length > 0 ? (
        <style>{`${previewCss}\n${pickerCss}`}</style>
      ) : null}
      <Box
        ref={hostRef}
        sx={{
          display: showHtml ? "none" : "block",
          minHeight: ready ? undefined : 320,
          width: "100%",
          "& .ql-toolbar.ql-snow": {
            borderColor: error ? "error.main" : "divider",
            borderTopLeftRadius: 1,
            borderTopRightRadius: 1,
            backgroundColor: "background.paper",
          },
          /* Tailwind preflight sets svg { display: block }, which collapses Quill icons */
          "& .ql-toolbar.ql-snow button svg, & .ql-toolbar.ql-snow .ql-picker svg":
            {
              display: "inline",
            },
          "& .ql-container.ql-snow": {
            borderColor: error ? "error.main" : "divider",
            borderBottomLeftRadius: 1,
            borderBottomRightRadius: 1,
            minHeight: 280,
            fontSize: "1rem",
            backgroundColor: "background.paper",
            color: "text.primary",
          },
          "& .ql-editor": {
            minHeight: 280,
          },
          "& .ql-editor.ql-blank::before": {
            fontStyle: "normal",
            color: "text.disabled",
          },
        }}
      />
      {showHtml ? (
        <TextField
          value={htmlDraft}
          onChange={(event) => {
            const next = event.target.value;
            setHtmlDraft(next);
            const normalized = isEmptyHtml(next) ? "" : next;
            valueRef.current = normalized;
            setValue(normalized);
          }}
          disabled={disabled}
          error={error}
          fullWidth
          multiline
          minRows={12}
          spellCheck={false}
          inputProps={{
            "aria-label": "Źródło HTML",
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            },
          }}
        />
      ) : null}
      {helperText ? (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      ) : null}
      {statusHelper ? (
        <FormHelperText error={Boolean(stylesError)}>
          {statusHelper}
        </FormHelperText>
      ) : null}
    </Box>
  );
}
