"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import type { ArticleImageActionState } from "@/lib/articles/types";
import { getAccessToken } from "@/lib/auth/session";
import { getImageFileFromFormData } from "@/lib/images/form-data";
import {
  deleteMagazineImage,
  patchMagazineImage,
  replaceMagazineImageContent,
  uploadMagazineImage,
} from "@/lib/magazine-images/api";

async function ensureAuthenticated(): Promise<ArticleImageActionState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidateImagePaths(magazineId: string) {
  revalidatePath("/images");
  revalidatePath(`/magazines/${magazineId}/edit`);
  revalidatePath("/articles");
}

function parsePositiveInt(value: FormDataEntryValue | null, fieldLabel: string) {
  const raw = String(value ?? "").trim();
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { error: `${fieldLabel} musi być liczbą całkowitą ≥ 1.` } as const;
  }
  return { value: parsed } as const;
}

export async function uploadMagazineImageAction(
  magazineId: string,
  formData: FormData,
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = magazineId.trim();
  if (!id) {
    return { error: "Brak identyfikatora magazynu." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Wybierz plik zdjęcia." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (title.length > 512) {
    return { error: "Tytuł może mieć co najwyżej 512 znaków." };
  }

  const modulesXRaw = String(formData.get("modulesX") ?? "").trim();
  const modulesYRaw = String(formData.get("modulesY") ?? "").trim();
  let modulesX: number | undefined;
  let modulesY: number | undefined;

  if (modulesXRaw) {
    const result = parsePositiveInt(modulesXRaw, "Szerokość w modułach");
    if ("error" in result) return { error: result.error };
    modulesX = result.value;
  }
  if (modulesYRaw) {
    const result = parsePositiveInt(modulesYRaw, "Wysokość w modułach");
    if ("error" in result) return { error: result.error };
    modulesY = result.value;
  }

  const uploadBody = new FormData();
  uploadBody.append("file", file);

  try {
    await uploadMagazineImage(id, uploadBody, {
      title: title || undefined,
      description: description || undefined,
      modulesX,
      modulesY,
    });
    revalidateImagePaths(id);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateMagazineImageAction(
  magazineId: string,
  imageId: string,
  formData: FormData,
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const magazine = magazineId.trim();
  const image = imageId.trim();
  if (!magazine || !image) {
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
      await replaceMagazineImageContent(magazine, image, uploadBody);
    }
    await patchMagazineImage(magazine, image, {
      title,
      description,
      modulesX: modulesXResult.value,
      modulesY: modulesYResult.value,
    });
    revalidateImagePaths(magazine);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteMagazineImageAction(
  magazineId: string,
  imageId: string,
): Promise<ArticleImageActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const magazine = magazineId.trim();
  const image = imageId.trim();
  if (!magazine || !image) {
    return { error: "Nieprawidłowe dane zdjęcia." };
  }

  try {
    await deleteMagazineImage(magazine, image);
    revalidateImagePaths(magazine);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
