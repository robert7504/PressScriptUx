import type {
  ParagraphStyle,
  ParagraphStyleFontWeight,
  ParagraphStyleTextAlign,
} from "./types";

export const PARAGRAPH_STYLE_FORMAT = "ps";

const FONT_WEIGHT_CSS: Record<ParagraphStyleFontWeight, number> = {
  LIGHT: 300,
  REGULAR: 400,
  MEDIUM: 500,
  SEMIBOLD: 600,
  BOLD: 700,
};

const TEXT_ALIGN_CSS: Record<ParagraphStyleTextAlign, string> = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
  JUSTIFY: "justify",
};

function cssEscapeIdent(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

export function sortParagraphStyles(styles: ParagraphStyle[]) {
  return [...styles].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, "pl");
  });
}

export function buildParagraphStylePreviewCss(styles: ParagraphStyle[]) {
  return styles
    .map((style) => {
      const selector = `.ql-editor .${cssEscapeIdent(style.cssClass)}`;
      const declarations: string[] = [`font-size: ${style.fontSize}px`];

      if (style.fontFamily) {
        declarations.push(`font-family: ${style.fontFamily}`);
      }
      if (style.fontWeight) {
        declarations.push(`font-weight: ${FONT_WEIGHT_CSS[style.fontWeight]}`);
      }
      if (style.lineHeight != null) {
        declarations.push(`line-height: ${style.lineHeight}`);
      }
      if (style.textAlign) {
        declarations.push(`text-align: ${TEXT_ALIGN_CSS[style.textAlign]}`);
      }
      if (style.color) {
        declarations.push(`color: ${style.color}`);
      }

      return `${selector} { ${declarations.join("; ")}; }`;
    })
    .join("\n");
}

export function buildParagraphStylePickerCss(styles: ParagraphStyle[]) {
  const items = styles
    .map((style) => {
      const label = JSON.stringify(style.name);
      const value = cssEscapeIdent(style.cssClass);
      return [
        `.ql-snow .ql-picker.ql-${PARAGRAPH_STYLE_FORMAT} .ql-picker-item[data-value="${value}"]::before { content: ${label}; }`,
        `.ql-snow .ql-picker.ql-${PARAGRAPH_STYLE_FORMAT} .ql-picker-label[data-value="${value}"]::before { content: ${label}; }`,
      ].join("\n");
    })
    .join("\n");

  return [
    `.ql-snow .ql-picker.ql-${PARAGRAPH_STYLE_FORMAT} { width: 180px; }`,
    `.ql-snow .ql-picker.ql-${PARAGRAPH_STYLE_FORMAT} .ql-picker-label::before,`,
    `.ql-snow .ql-picker.ql-${PARAGRAPH_STYLE_FORMAT} .ql-picker-item::before { content: "Styl akapitowy"; }`,
    `.ql-snow .ql-picker.ql-${PARAGRAPH_STYLE_FORMAT} .ql-picker-item[data-value=""]::before,`,
    `.ql-snow .ql-picker.ql-${PARAGRAPH_STYLE_FORMAT} .ql-picker-label[data-value=""]::before { content: "Bez stylu"; }`,
    items,
  ].join("\n");
}

export function htmlTagToQuillFormats(htmlTag: ParagraphStyle["htmlTag"]): {
  header: number | false;
  blockquote: boolean;
} {
  if (htmlTag.startsWith("H")) {
    const level = Number(htmlTag.slice(1));
    if (level >= 1 && level <= 6) {
      return { header: level, blockquote: false };
    }
  }
  if (htmlTag === "BLOCKQUOTE") {
    return { header: false, blockquote: true };
  }
  return { header: false, blockquote: false };
}
