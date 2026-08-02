export const MAGAZINE_CONFIGURATION_TYPES = [
  "LAYOUT",
  "TYPOGRAPHY",
  "PRICING",
  "WORKFLOW",
  "EXPORT",
  "GENERAL",
] as const;

export type MagazineConfigurationType =
  (typeof MAGAZINE_CONFIGURATION_TYPES)[number];

export const MAGAZINE_CONFIGURATION_TYPE_LABELS: Record<
  MagazineConfigurationType,
  string
> = {
  LAYOUT: "Layout (wzorce stron)",
  TYPOGRAPHY: "Typografia",
  PRICING: "Cennik",
  WORKFLOW: "Workflow",
  EXPORT: "Eksport",
  GENERAL: "Ogólna",
};

export type MagazineConfiguration = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: MagazineConfigurationType | null;
  version: number | null;
  priority: number | null;
  payload: Record<string, unknown> | null;
  schemaKey: string | null;
  parentId: string | null;
  pageTemplateIdList: string[] | null;
  validFrom: string | null;
  validTo: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  magazineIdList: string[];
};

export type MagazineConfigurationCreateInput = {
  slug: string;
  name: string;
  description?: string | null;
  type?: MagazineConfigurationType | null;
  version?: number | null;
  priority?: number | null;
  payload?: Record<string, unknown> | null;
  schemaKey?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  notes?: string | null;
  magazineIdList: string[];
};

export type MagazineConfigurationUpdateInput = {
  slug: string;
  name: string;
  description?: string | null;
  type?: MagazineConfigurationType | null;
  version?: number | null;
  priority?: number | null;
  payload?: Record<string, unknown> | null;
  schemaKey?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  notes?: string | null;
  active?: boolean;
  magazineIdList: string[];
};

export type MagazineConfigurationFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    name?: string;
    slug?: string;
    magazineIdList?: string;
    version?: string;
    priority?: string;
    payload?: string;
    validFrom?: string;
    validTo?: string;
  };
};
