export type ArticlePageCoordinates = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type ArticlePageBinding = {
  id: string;
  articleId: string;
  pageId: string;
  coordinates: ArticlePageCoordinates;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ArticlePageBindingCreateInput = {
  articleId: string;
  pageId: string;
  coordinates: ArticlePageCoordinates;
};

export type ArticlePageBindingActionState = {
  error?: string;
  success?: boolean;
};
