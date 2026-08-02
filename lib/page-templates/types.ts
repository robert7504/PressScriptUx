export const PAGE_TEMPLATE_UNITS = ["MM", "CM", "INCH", "PT"] as const;

export type PageTemplateUnit = (typeof PAGE_TEMPLATE_UNITS)[number];

export const PAGE_TEMPLATE_UNIT_LABELS: Record<PageTemplateUnit, string> = {
  MM: "mm",
  CM: "cm",
  INCH: "cal",
  PT: "pt",
};

export const PAGE_TEMPLATE_ORIENTATIONS = ["PORTRAIT", "LANDSCAPE"] as const;

export type PageTemplateOrientation =
  (typeof PAGE_TEMPLATE_ORIENTATIONS)[number];

export const PAGE_TEMPLATE_ORIENTATION_LABELS: Record<
  PageTemplateOrientation,
  string
> = {
  PORTRAIT: "Pionowa",
  LANDSCAPE: "Pozioma",
};

export const PAGE_TEMPLATE_PAGE_SIDES = [
  "LEFT",
  "RIGHT",
  "UNSPECIFIED",
] as const;

export type PageTemplatePageSide = (typeof PAGE_TEMPLATE_PAGE_SIDES)[number];

export const PAGE_TEMPLATE_PAGE_SIDE_LABELS: Record<
  PageTemplatePageSide,
  string
> = {
  LEFT: "Lewa",
  RIGHT: "Prawa",
  UNSPECIFIED: "Nieokreślona",
};

export const PAGE_TEMPLATE_COLOR_MODES = [
  "COLOR",
  "GRAYSCALE",
  "BLACK_WHITE",
] as const;

export type PageTemplateColorMode = (typeof PAGE_TEMPLATE_COLOR_MODES)[number];

export const PAGE_TEMPLATE_COLOR_MODE_LABELS: Record<
  PageTemplateColorMode,
  string
> = {
  COLOR: "Kolor",
  GRAYSCALE: "Skala szarości",
  BLACK_WHITE: "Czarno-biały",
};

export type PageTemplate = {
  id: string;
  configurationId: string;
  slug: string;
  name: string;
  description: string | null;
  unit: PageTemplateUnit | null;
  width: number;
  height: number;
  modulesX: number;
  modulesY: number;
  moduleGapX: number;
  moduleGapY: number;
  marginTop: number | null;
  marginRight: number | null;
  marginBottom: number | null;
  marginLeft: number | null;
  bleed: number | null;
  orientation: PageTemplateOrientation | null;
  pageSide: PageTemplatePageSide | null;
  colorMode: PageTemplateColorMode | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PageTemplateCreateInput = {
  configurationId: string;
  slug: string;
  name: string;
  description?: string | null;
  unit?: PageTemplateUnit | null;
  width: number;
  height: number;
  modulesX: number;
  modulesY: number;
  moduleGapX: number;
  moduleGapY: number;
  marginTop?: number | null;
  marginRight?: number | null;
  marginBottom?: number | null;
  marginLeft?: number | null;
  bleed?: number | null;
  orientation?: PageTemplateOrientation | null;
  pageSide?: PageTemplatePageSide | null;
  colorMode?: PageTemplateColorMode | null;
  notes?: string | null;
};

export type PageTemplateUpdateInput = PageTemplateCreateInput & {
  active?: boolean;
};

export type PageTemplateFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    configurationId?: string;
    name?: string;
    slug?: string;
    unit?: string;
    width?: string;
    height?: string;
    modulesX?: string;
    modulesY?: string;
    moduleGapX?: string;
    moduleGapY?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    bleed?: string;
    orientation?: string;
    pageSide?: string;
    colorMode?: string;
  };
};
