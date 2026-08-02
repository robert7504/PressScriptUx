export const ARTICLE_STATUSES = [
  "DRAFT",
  "READY",
  "IN_LAYOUT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type Article = {
  id: string;
  kicker: string | null;
  title: string;
  subtitle: string | null;
  lead: string | null;
  content: string;
  byline: string | null;
  status: ArticleStatus;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  sectionIdList: string[];
};

export type ArticleCreateInput = {
  kicker?: string | null;
  title: string;
  subtitle?: string | null;
  lead?: string | null;
  content: string;
  byline?: string | null;
  status?: ArticleStatus;
  notes?: string | null;
  sectionIdList?: string[];
};

export type ArticleUpdateInput = ArticleCreateInput & {
  active?: boolean;
};

export type ArticleFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    title?: string;
    content?: string;
  };
};

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Szkic",
  READY: "Gotowy",
  IN_LAYOUT: "W łamaniu",
  PUBLISHED: "Opublikowany",
  ARCHIVED: "Zarchiwizowany",
};
