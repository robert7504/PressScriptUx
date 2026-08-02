import "server-only";

import { apiFetch } from "../api/client";
import type {
  Article,
  ArticleCreateInput,
  ArticleStatus,
  ArticleUpdateInput,
} from "./types";

export type ListArticlesParams = {
  active?: boolean;
  sectionId?: string;
  issueId?: string;
  status?: ArticleStatus;
};

export async function listArticles(params: ListArticlesParams = {}) {
  return apiFetch<Article[]>("/articles", {
    method: "GET",
    searchParams: {
      active: params.active,
      sectionId: params.sectionId,
      issueId: params.issueId,
      status: params.status,
    },
  });
}

export async function getArticle(id: string) {
  return apiFetch<Article>(`/articles/${id}`, { method: "GET" });
}

export async function createArticle(input: ArticleCreateInput) {
  return apiFetch<Article>("/articles", {
    method: "POST",
    body: input,
  });
}

export async function updateArticle(id: string, input: ArticleUpdateInput) {
  return apiFetch<Article>(`/articles/${id}`, {
    method: "PUT",
    body: input,
  });
}
