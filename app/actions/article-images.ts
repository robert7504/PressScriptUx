"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import {
  attachArticleImages,
  deleteArticleImage,
  patchArticleImage,
  replaceArticleImageContent,
  uploadArticleImage,
} from "@/lib/articles/api";
import type { ArticleImageActionState } from "@/lib/articles/types";
import { getAccessToken } from "@/lib/auth/session";
import { getImageFileFromFormData } from "@/lib/images/form-data";

async function ensureAuthenticated(): Promise<ArticleImageActionState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidateArticlePaths(articleId: string) {
  revalidatePath("/articles");
  revalidatePath(`/articles/${articleId}/edit`);
  revalidatePath("/images");
}

export async function uploadArticleImageAction(
  articleId: string,
  formData: FormData,
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = articleId.trim();
  if (!id) {
    return { error: "Brak identyfikatora artykułu." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Wybierz plik zdjęcia." };
  }

  const main = String(formData.get("main") ?? "") === "true";
  const uploadBody = new FormData();
  uploadBody.append("file", file);

  try {
    await uploadArticleImage(id, uploadBody, { main });
    revalidateArticlePaths(id);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function attachArticleImagesAction(
  articleId: string,
  imageIds: string[],
  options: { main?: boolean } = {},
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = articleId.trim();
  const ids = imageIds.map((value) => value.trim()).filter(Boolean);
  if (!id) {
    return { error: "Brak identyfikatora artykułu." };
  }
  if (ids.length === 0) {
    return { error: "Wybierz co najmniej jedno zdjęcie z puli." };
  }

  try {
    await attachArticleImages(id, {
      imageIds: ids,
      main: options.main,
    });
    revalidateArticlePaths(id);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function setMainArticleImageAction(
  articleId: string,
  imageId: string,
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const article = articleId.trim();
  const image = imageId.trim();
  if (!article || !image) {
    return { error: "Nieprawidłowe dane zdjęcia." };
  }

  try {
    await patchArticleImage(article, image, { main: true });
    revalidateArticlePaths(article);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

function parsePositiveInt(value: FormDataEntryValue | null, fieldLabel: string) {
  const raw = String(value ?? "").trim();
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { error: `${fieldLabel} musi być liczbą całkowitą ≥ 1.` } as const;
  }
  return { value: parsed } as const;
}

export async function updateArticleImageAction(
  articleId: string,
  imageId: string,
  formData: FormData,
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const article = articleId.trim();
  const image = imageId.trim();
  if (!article || !image) {
    return { error: "Nieprawidłowe dane zdjęcia." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const modulesXResult = parsePositiveInt(
    formData.get("modulesX"),
    "Szerokość w modułach",
  );
  if ("error" in modulesXResult) return { error: modulesXResult.error };
  const modulesYResult = parsePositiveInt(
    formData.get("modulesY"),
    "Wysokość w modułach",
  );
  if ("error" in modulesYResult) return { error: modulesYResult.error };

  if (title.length > 512) {
    return { error: "Tytuł może mieć co najwyżej 512 znaków." };
  }

  const file = getImageFileFromFormData(formData);

  try {
    if (file) {
      const uploadBody = new FormData();
      uploadBody.append("file", file);
      await replaceArticleImageContent(article, image, uploadBody);
    }
    await patchArticleImage(article, image, {
      title,
      description,
      modulesX: modulesXResult.value,
      modulesY: modulesYResult.value,
    });
    revalidateArticlePaths(article);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteArticleImageAction(
  articleId: string,
  imageId: string,
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const article = articleId.trim();
  const image = imageId.trim();
  if (!article || !image) {
    return { error: "Nieprawidłowe dane zdjęcia." };
  }

  try {
    await deleteArticleImage(article, image);
    revalidateArticlePaths(article);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
