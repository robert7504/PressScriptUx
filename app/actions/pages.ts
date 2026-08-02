"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import {
  createPagesFromTemplate,
  deletePage,
} from "@/lib/pages/api";
import type { PagesFromTemplateFormState } from "@/lib/pages/types";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalPositiveInt(
  raw: string,
  field: "startPage" | "pageCount",
  fieldErrors: NonNullable<PagesFromTemplateFormState["fieldErrors"]>,
): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fieldErrors[field] = "Podaj liczbę całkowitą większą od 0";
    return null;
  }
  return parsed;
}

async function ensureAuthenticated(): Promise<PagesFromTemplateFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidatePagePaths(sectionId: string, issueId?: string | null) {
  revalidatePath(`/sections/${sectionId}/edit`);
  revalidatePath(`/sections/${sectionId}/pages`, "layout");
  revalidatePath("/sections");
  if (issueId) {
    revalidatePath(`/issues/${issueId}/edit`);
  }
}

export async function createPagesFromTemplateAction(
  sectionId: string,
  issueId: string | null,
  _prevState: PagesFromTemplateFormState,
  formData: FormData,
): Promise<PagesFromTemplateFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const configurationId = String(formData.get("configurationId") ?? "").trim();
  const sectionCode = emptyToNull(String(formData.get("sectionCode") ?? ""));
  const pageTemplateIds = formData
    .getAll("pageTemplateIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  // Backward-compatible single-template field
  const singleTemplateId = emptyToNull(
    String(formData.get("pageTemplateId") ?? ""),
  );
  if (singleTemplateId && !pageTemplateIds.includes(singleTemplateId)) {
    pageTemplateIds.push(singleTemplateId);
  }

  const fieldErrors: NonNullable<PagesFromTemplateFormState["fieldErrors"]> =
    {};

  if (!configurationId) {
    fieldErrors.configurationId = "Wybierz konfigurację Layout";
  }
  if (sectionCode && sectionCode.length > 64) {
    fieldErrors.sectionCode = "Kod może mieć max. 64 znaki";
  }
  if (pageTemplateIds.length === 0) {
    fieldErrors.pageTemplateId = "Zaznacz co najmniej jeden wzorzec stron";
  }

  const startPage = parseOptionalPositiveInt(
    String(formData.get("startPage") ?? "").trim(),
    "startPage",
    fieldErrors,
  );
  const overwriteExisting =
    String(formData.get("overwriteExisting") ?? "") === "true" ||
    String(formData.get("overwriteExisting") ?? "") === "on";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const baseStartPage = startPage ?? 1;

  try {
    let createdCount = 0;
    for (let index = 0; index < pageTemplateIds.length; index += 1) {
      const pageTemplateId = pageTemplateIds[index];
      const pages = await createPagesFromTemplate(sectionId, {
        configurationId,
        sectionCode,
        pageTemplateId,
        startPage: baseStartPage + index,
        pageCount: 1,
        overwriteExisting,
      });
      createdCount += pages.length;
    }
    revalidatePagePaths(sectionId, issueId);
    return { success: true, createdCount };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deletePageAction(
  id: string,
  sectionId: string,
  issueId?: string | null,
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deletePage(id);
    revalidatePagePaths(sectionId, issueId);
    return {};
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
