import "server-only";

import { apiFetch, apiFetchBinary } from "../api/client";
import type {
  Article,
  ArticleCreateInput,
  ArticleImage,
  ArticleImageAttachInput,
  ArticleImagePatchInput,
  ArticleStatus,
  ArticleUpdateInput,
} from "./types";

export type ListArticlesParams = {
  active?: boolean;
  magazineId?: string;
  sectionId?: string;
  issueId?: string;
  status?: ArticleStatus;
};

export async function listArticles(params: ListArticlesParams = {}) {
  return apiFetch<Article[]>("/articles", {
    method: "GET",
    searchParams: {
      active: params.active,
      magazineId: params.magazineId,
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

export async function listArticleImages(articleId: string) {
  return apiFetch<ArticleImage[]>(`/articles/${articleId}/images`, {
    method: "GET",
  });
}

export async function uploadArticleImage(
  articleId: string,
  file: FormData,
  options: {
    main?: boolean;
    modulesX?: number;
    modulesY?: number;
    title?: string;
    description?: string;
  } = {},
) {
  return apiFetch<ArticleImage>(`/articles/${articleId}/images`, {
    method: "POST",
    body: file,
    searchParams: {
      main: options.main,
      modulesX: options.modulesX,
      modulesY: options.modulesY,
      title: options.title,
      description: options.description,
    },
  });
}

export async function attachArticleImages(
  articleId: string,
  input: ArticleImageAttachInput,
) {
  return apiFetch<ArticleImage[]>(`/articles/${articleId}/images/attach`, {
    method: "POST",
    body: input,
  });
}

export async function patchArticleImage(
  articleId: string,
  imageId: string,
  input: ArticleImagePatchInput,
) {
  return apiFetch<ArticleImage>(
    `/articles/${articleId}/images/${imageId}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export async function deleteArticleImage(articleId: string, imageId: string) {
  return apiFetch<void>(`/articles/${articleId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function getArticleImageContent(
  articleId: string,
  imageId: string,
) {
  return apiFetchBinary(
    `/articles/${articleId}/images/${imageId}/content`,
    { method: "GET" },
  );
}

export async function replaceArticleImageContent(
  articleId: string,
  imageId: string,
  file: FormData,
) {
  return apiFetch<ArticleImage>(
    `/articles/${articleId}/images/${imageId}/content`,
    {
      method: "PUT",
      body: file,
    },
  );
}
