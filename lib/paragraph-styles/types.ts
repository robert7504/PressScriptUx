export const PARAGRAPH_STYLE_HTML_TAGS = [
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "LI",
] as const;

export type ParagraphStyleHtmlTag =
  (typeof PARAGRAPH_STYLE_HTML_TAGS)[number];

export const PARAGRAPH_STYLE_HTML_TAG_LABELS: Record<
  ParagraphStyleHtmlTag,
  string
> = {
  P: "Akapit (p)",
  H1: "Nagłówek H1",
  H2: "Nagłówek H2",
  H3: "Nagłówek H3",
  H4: "Nagłówek H4",
  H5: "Nagłówek H5",
  H6: "Nagłówek H6",
  BLOCKQUOTE: "Cytat",
  LI: "Element listy",
};

export const PARAGRAPH_STYLE_FONT_WEIGHTS = [
  "LIGHT",
  "REGULAR",
  "MEDIUM",
  "SEMIBOLD",
  "BOLD",
] as const;

export type ParagraphStyleFontWeight =
  (typeof PARAGRAPH_STYLE_FONT_WEIGHTS)[number];

export const PARAGRAPH_STYLE_FONT_WEIGHT_LABELS: Record<
  ParagraphStyleFontWeight,
  string
> = {
  LIGHT: "Light",
  REGULAR: "Regular",
  MEDIUM: "Medium",
  SEMIBOLD: "Semibold",
  BOLD: "Bold",
};

export const PARAGRAPH_STYLE_TEXT_ALIGNS = [
  "LEFT",
  "CENTER",
  "RIGHT",
  "JUSTIFY",
] as const;

export type ParagraphStyleTextAlign =
  (typeof PARAGRAPH_STYLE_TEXT_ALIGNS)[number];

export const PARAGRAPH_STYLE_TEXT_ALIGN_LABELS: Record<
  ParagraphStyleTextAlign,
  string
> = {
  LEFT: "Do lewej",
  CENTER: "Wyśrodkowany",
  RIGHT: "Do prawej",
  JUSTIFY: "Wyjustowany",
};

export type ParagraphStyle = {
  id: string;
  configurationId: string;
  slug: string;
  name: string;
  description: string | null;
  htmlTag: ParagraphStyleHtmlTag;
  cssClass: string;
  indesignStyleName: string;
  charactersPerModule: number;
  fontSize: number;
  fontFamily: string | null;
  fontWeight: ParagraphStyleFontWeight | null;
  lineHeight: number | null;
  textAlign: ParagraphStyleTextAlign | null;
  color: string | null;
  sortOrder: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ParagraphStyleCreateInput = {
  configurationId: string;
  slug: string;
  name: string;
  description?: string | null;
  htmlTag: ParagraphStyleHtmlTag;
  cssClass: string;
  indesignStyleName: string;
  charactersPerModule: number;
  fontSize: number;
  fontFamily?: string | null;
  fontWeight?: ParagraphStyleFontWeight | null;
  lineHeight?: number | null;
  textAlign?: ParagraphStyleTextAlign | null;
  color?: string | null;
  sortOrder?: number | null;
};

export type ParagraphStyleUpdateInput = ParagraphStyleCreateInput & {
  active?: boolean;
};

export type ParagraphStyleFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    configurationId?: string;
    name?: string;
    slug?: string;
    htmlTag?: string;
    cssClass?: string;
    indesignStyleName?: string;
    charactersPerModule?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
    lineHeight?: string;
    sortOrder?: string;
  };
};
