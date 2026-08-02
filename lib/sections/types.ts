export const SECTION_TYPES = [
  "MAIN",
  "SUPPLEMENT",
  "ADVERTISING",
  "SPECIAL",
  "OTHER",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  MAIN: "Główny",
  SUPPLEMENT: "Dodatek",
  ADVERTISING: "Reklamowy",
  SPECIAL: "Specjalny",
  OTHER: "Inny",
};

export type Section = {
  id: string;
  issueId: string;
  name: string;
  code: string | null;
  type: SectionType | null;
  sortOrder: number | null;
  pageCount: number | null;
  pageFormat: string | null;
  startPage: number | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SectionCreateInput = {
  issueId: string;
  name: string;
  code?: string | null;
  type?: SectionType | null;
  sortOrder?: number | null;
  pageCount?: number | null;
  pageFormat?: string | null;
  startPage?: number | null;
  notes?: string | null;
};

export type SectionUpdateInput = {
  name: string;
  code?: string | null;
  type?: SectionType | null;
  sortOrder?: number | null;
  pageCount?: number | null;
  pageFormat?: string | null;
  startPage?: number | null;
  notes?: string | null;
  active?: boolean;
};

export type SectionFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    issueId?: string;
    name?: string;
    code?: string;
    type?: string;
    sortOrder?: string;
    pageCount?: string;
    startPage?: string;
  };
};
