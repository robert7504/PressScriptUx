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
  magazineId: string;
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
  mainImageId?: string | null;
  imageIdList?: string[];
};

export type ArticleImage = {
  id: string;
  magazineId: string;
  articleId: string | null;
  originalFileName: string;
  title: string | null;
  description: string | null;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  main: boolean;
  modulesX: number;
  modulesY: number;
  createdAt: string;
  contentUrl: string;
};

export type ArticleImagePatchInput = {
  title?: string | null;
  description?: string | null;
  main?: boolean;
  sortOrder?: number;
  modulesX?: number;
  modulesY?: number;
};

export type ArticleImageAttachInput = {
  imageIds: string[];
  main?: boolean;
};

export type ArticleImageActionState = {
  error?: string;
  success?: boolean;
};

export function articleImageContentPath(articleId: string, imageId: string) {
  return `/api/articles/${articleId}/images/${imageId}/content`;
}

export function magazineImageContentPath(magazineId: string, imageId: string) {
  return `/api/magazines/${magazineId}/images/${imageId}/content`;
}

export function imageContentPath(image: ArticleImage) {
  const base = image.articleId
    ? articleImageContentPath(image.articleId, image.id)
    : magazineImageContentPath(image.magazineId, image.id);
  // Bust browser cache after file replace (same URL, new bytes).
  return `${base}?v=${image.sizeBytes}-${encodeURIComponent(image.originalFileName)}`;
}

export type ArticleCreateInput = {
  magazineId: string;
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
    magazineId?: string;
    binding?: string;
  };
};

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Szkic",
  READY: "Gotowy",
  IN_LAYOUT: "W łamaniu",
  PUBLISHED: "Opublikowany",
  ARCHIVED: "Zarchiwizowany",
};
