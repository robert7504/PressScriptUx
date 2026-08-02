import "server-only";

import { apiFetch } from "../api/client";
import type {
  ArticlePageBinding,
  ArticlePageBindingCreateInput,
  ArticlePageBindingUpdateInput,
} from "./types";

export type ListArticlePageBindingsParams = {
  active?: boolean;
  articleId?: string;
  pageId?: string;
};

export async function listArticlePageBindings(
  params: ListArticlePageBindingsParams = {},
) {
  return apiFetch<ArticlePageBinding[]>("/article-page-bindings", {
    method: "GET",
    searchParams: {
      active: params.active,
      articleId: params.articleId,
      pageId: params.pageId,
    },
  });
}

export async function createArticlePageBinding(
  input: ArticlePageBindingCreateInput,
) {
  return apiFetch<ArticlePageBinding>("/article-page-bindings", {
    method: "POST",
    body: input,
  });
}

export async function updateArticlePageBinding(
  id: string,
  input: ArticlePageBindingUpdateInput,
) {
  return apiFetch<ArticlePageBinding>(`/article-page-bindings/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteArticlePageBinding(id: string) {
  return apiFetch<void>(`/article-page-bindings/${id}`, {
    method: "DELETE",
  });
}
