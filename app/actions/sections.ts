"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import {
  createSection,
  deleteSection,
  updateSection,
} from "@/lib/sections/api";
import {
  SECTION_TYPES,
  type SectionFormState,
  type SectionType,
} from "@/lib/sections/types";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseType(value: string): SectionType | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (SECTION_TYPES as readonly string[]).includes(trimmed)
    ? (trimmed as SectionType)
    : null;
}

function parseOptionalInt(
  raw: string,
  field: "sortOrder" | "pageCount" | "startPage",
  fieldErrors: NonNullable<SectionFormState["fieldErrors"]>,
  options?: { min?: number },
): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    fieldErrors[field] = "Podaj liczbę całkowitą";
    return null;
  }
  if (options?.min !== undefined && parsed < options.min) {
    fieldErrors[field] = `Wartość nie może być mniejsza niż ${options.min}`;
    return null;
  }
  return parsed;
}

function readSectionFields(formData: FormData, requireIssue: boolean) {
  const issueId = String(formData.get("issueId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");
  const fieldErrors: NonNullable<SectionFormState["fieldErrors"]> = {};

  if (requireIssue && !issueId) {
    fieldErrors.issueId = "Wybierz wydanie";
  }
  if (!name) {
    fieldErrors.name = "Nazwa jest wymagana";
  }

  const type = parseType(typeRaw);
  if (typeRaw.trim() && !type) {
    fieldErrors.type = "Nieprawidłowy typ grzbietu";
  }

  const sortOrder = parseOptionalInt(
    String(formData.get("sortOrder") ?? "").trim(),
    "sortOrder",
    fieldErrors,
  );
  const pageCount = parseOptionalInt(
    String(formData.get("pageCount") ?? "").trim(),
    "pageCount",
    fieldErrors,
    { min: 0 },
  );
  const startPage = parseOptionalInt(
    String(formData.get("startPage") ?? "").trim(),
    "startPage",
    fieldErrors,
    { min: 1 },
  );

  const code = emptyToNull(String(formData.get("code") ?? ""));
  if (code && code.length > 32) {
    fieldErrors.code = "Kod może mieć max. 32 znaki";
  }

  return {
    fieldErrors,
    payload:
      name && (!requireIssue || issueId) && Object.keys(fieldErrors).length === 0
        ? {
            issueId,
            name,
            code,
            type,
            sortOrder,
            pageCount,
            pageFormat: emptyToNull(String(formData.get("pageFormat") ?? "")),
            startPage,
            notes: emptyToNull(String(formData.get("notes") ?? "")),
          }
        : null,
  };
}

async function ensureAuthenticated(): Promise<SectionFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidateSectionPaths(issueId?: string | null, sectionId?: string) {
  revalidatePath("/sections");
  if (sectionId) {
    revalidatePath(`/sections/${sectionId}/edit`);
  }
  if (issueId) {
    revalidatePath(`/issues/${issueId}/edit`);
  }
  revalidatePath("/issues");
  revalidatePath("/articles");
}

export async function createSectionAction(
  _prevState: SectionFormState,
  formData: FormData,
): Promise<SectionFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readSectionFields(formData, true);
  if (Object.keys(fieldErrors).length > 0 || !payload) {
    return { fieldErrors };
  }

  try {
    const section = await createSection(payload);
    revalidateSectionPaths(payload.issueId, section.id);
    redirect(`/sections/${section.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateSectionAction(
  id: string,
  _prevState: SectionFormState,
  formData: FormData,
): Promise<SectionFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readSectionFields(formData, false);
  if (Object.keys(fieldErrors).length > 0 || !payload) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  try {
    await updateSection(id, {
      name: payload.name,
      code: payload.code,
      type: payload.type,
      sortOrder: payload.sortOrder,
      pageCount: payload.pageCount,
      pageFormat: payload.pageFormat,
      startPage: payload.startPage,
      notes: payload.notes,
      active,
    });
    revalidateSectionPaths(payload.issueId || null, id);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteSectionAction(
  id: string,
  issueId?: string,
  redirectTo = "/sections",
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deleteSection(id);
    revalidateSectionPaths(issueId);
    redirect(redirectTo);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
