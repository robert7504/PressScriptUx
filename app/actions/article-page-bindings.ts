"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import {
  createArticlePageBinding,
  deleteArticlePageBinding,
} from "@/lib/article-page-bindings/api";
import type {
  ArticlePageBindingActionState,
  ArticlePageCoordinates,
} from "@/lib/article-page-bindings/types";
import { createArticle } from "@/lib/articles/api";
import { getAccessToken } from "@/lib/auth/session";

const PLACEHOLDER_CONTENT = "<p>Treść do uzupełnienia.</p>";

async function ensureAuthenticated(): Promise<ArticlePageBindingActionState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidateBindingPaths(sectionId: string, pageId: string) {
  revalidatePath(`/sections/${sectionId}/pages/${pageId}`);
  revalidatePath(`/sections/${sectionId}/edit`);
  revalidatePath("/articles");
}

function parseCoordinates(
  coordinates: ArticlePageCoordinates,
): ArticlePageCoordinates | null {
  const { x1, y1, x2, y2 } = coordinates;
  if (
    ![x1, y1, x2, y2].every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    return null;
  }
  return {
    x1: Math.min(x1, x2),
    y1: Math.min(y1, y2),
    x2: Math.max(x1, x2),
    y2: Math.max(y1, y2),
  };
}

export async function createArticlePageBindingAction(input: {
  articleId: string;
  pageId: string;
  sectionId: string;
  coordinates: ArticlePageCoordinates;
}): Promise<ArticlePageBindingActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const articleId = input.articleId.trim();
  const pageId = input.pageId.trim();
  const sectionId = input.sectionId.trim();
  const coordinates = parseCoordinates(input.coordinates);

  if (!articleId || !pageId || !sectionId || !coordinates) {
    return { error: "Nieprawidłowe dane powiązania artykułu ze stroną." };
  }

  try {
    await createArticlePageBinding({ articleId, pageId, coordinates });
    revalidateBindingPaths(sectionId, pageId);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createArticleAndBindAction(input: {
  title: string;
  kicker?: string;
  byline?: string;
  pageId: string;
  sectionId: string;
  coordinates: ArticlePageCoordinates;
}): Promise<ArticlePageBindingActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const title = input.title.trim();
  const pageId = input.pageId.trim();
  const sectionId = input.sectionId.trim();
  const coordinates = parseCoordinates(input.coordinates);

  if (!title) {
    return { error: "Tytuł artykułu jest wymagany." };
  }
  if (!pageId || !sectionId || !coordinates) {
    return { error: "Nieprawidłowe dane powiązania artykułu ze stroną." };
  }

  try {
    const article = await createArticle({
      title,
      content: PLACEHOLDER_CONTENT,
      kicker: emptyToNull(input.kicker ?? ""),
      byline: emptyToNull(input.byline ?? ""),
      status: "DRAFT",
      sectionIdList: [sectionId],
    });
    await createArticlePageBinding({
      articleId: article.id,
      pageId,
      coordinates,
    });
    revalidateBindingPaths(sectionId, pageId);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteArticlePageBindingAction(input: {
  id: string;
  pageId: string;
  sectionId: string;
}): Promise<ArticlePageBindingActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = input.id.trim();
  const pageId = input.pageId.trim();
  const sectionId = input.sectionId.trim();

  if (!id || !pageId || !sectionId) {
    return { error: "Nieprawidłowe dane powiązania." };
  }

  try {
    await deleteArticlePageBinding(id);
    revalidateBindingPaths(sectionId, pageId);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
