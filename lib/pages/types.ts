import {
  PAGE_TEMPLATE_COLOR_MODE_LABELS,
  PAGE_TEMPLATE_COLOR_MODES,
  PAGE_TEMPLATE_ORIENTATION_LABELS,
  PAGE_TEMPLATE_ORIENTATIONS,
  PAGE_TEMPLATE_PAGE_SIDE_LABELS,
  PAGE_TEMPLATE_PAGE_SIDES,
  PAGE_TEMPLATE_UNIT_LABELS,
  PAGE_TEMPLATE_UNITS,
  type PageTemplateColorMode,
  type PageTemplateOrientation,
  type PageTemplatePageSide,
  type PageTemplateUnit,
} from "../page-templates/types";

export const PAGE_UNITS = PAGE_TEMPLATE_UNITS;
export type PageUnit = PageTemplateUnit;
export const PAGE_UNIT_LABELS = PAGE_TEMPLATE_UNIT_LABELS;

export const PAGE_ORIENTATIONS = PAGE_TEMPLATE_ORIENTATIONS;
export type PageOrientation = PageTemplateOrientation;
export const PAGE_ORIENTATION_LABELS = PAGE_TEMPLATE_ORIENTATION_LABELS;

export const PAGE_SIDES = PAGE_TEMPLATE_PAGE_SIDES;
export type PageSide = PageTemplatePageSide;
export const PAGE_SIDE_LABELS = PAGE_TEMPLATE_PAGE_SIDE_LABELS;

export const PAGE_COLOR_MODES = PAGE_TEMPLATE_COLOR_MODES;
export type PageColorMode = PageTemplateColorMode;
export const PAGE_COLOR_MODE_LABELS = PAGE_TEMPLATE_COLOR_MODE_LABELS;

export type Page = {
  id: string;
  sectionId: string;
  pageNumber: number;
  name: string | null;
  sortOrder: number | null;
  unit: PageUnit | null;
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
  orientation: PageOrientation | null;
  pageSide: PageSide | null;
  notes: string | null;
  colorMode: PageColorMode | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PagesFromTemplateInput = {
  configurationId: string;
  sectionCode?: string | null;
  pageTemplateId?: string | null;
  startPage?: number | null;
  pageCount?: number | null;
  overwriteExisting?: boolean | null;
};

export type PagesFromTemplateFormState = {
  error?: string;
  success?: boolean;
  createdCount?: number;
  fieldErrors?: {
    configurationId?: string;
    sectionCode?: string;
    pageTemplateId?: string;
    startPage?: string;
    pageCount?: string;
  };
};
