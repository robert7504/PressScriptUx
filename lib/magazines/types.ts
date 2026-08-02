export const MAGAZINE_FREQUENCIES = [
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "IRREGULAR",
] as const;

export type MagazineFrequency = (typeof MAGAZINE_FREQUENCIES)[number];

export const MAGAZINE_FREQUENCY_LABELS: Record<MagazineFrequency, string> = {
  DAILY: "Codziennie",
  WEEKLY: "Tygodnik",
  BIWEEKLY: "Dwutygodnik",
  MONTHLY: "Miesięcznik",
  QUARTERLY: "Kwartalnik",
  YEARLY: "Rocznik",
  IRREGULAR: "Nieregularnie",
};

export type Magazine = {
  id: string;
  publisherId: string;
  name: string;
  shortName: string | null;
  issn: string | null;
  eissn: string | null;
  frequency: MagazineFrequency | null;
  language: string | null;
  pageFormat: string | null;
  defaultPageCount: number | null;
  description: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MagazineCreateInput = {
  publisherId: string;
  name: string;
  shortName?: string | null;
  issn?: string | null;
  eissn?: string | null;
  frequency?: MagazineFrequency | null;
  language?: string | null;
  pageFormat?: string | null;
  defaultPageCount?: number | null;
  description?: string | null;
  notes?: string | null;
};

export type MagazineUpdateInput = {
  name: string;
  shortName?: string | null;
  issn?: string | null;
  eissn?: string | null;
  frequency?: MagazineFrequency | null;
  language?: string | null;
  pageFormat?: string | null;
  defaultPageCount?: number | null;
  description?: string | null;
  notes?: string | null;
  active?: boolean;
};

export type MagazineFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    name?: string;
    publisherId?: string;
    defaultPageCount?: string;
  };
};
