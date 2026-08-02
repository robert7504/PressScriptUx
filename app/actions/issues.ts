"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import {
  createIssue,
  deleteIssue,
  updateIssue,
} from "@/lib/issues/api";
import {
  ISSUE_STATUSES,
  type IssueFormState,
  type IssueStatus,
} from "@/lib/issues/types";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStatus(value: string): IssueStatus | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (ISSUE_STATUSES as readonly string[]).includes(trimmed)
    ? (trimmed as IssueStatus)
    : null;
}

function parseOptionalInt(
  raw: string,
  field: keyof NonNullable<IssueFormState["fieldErrors"]>,
  fieldErrors: NonNullable<IssueFormState["fieldErrors"]>,
  options?: { min?: number; label?: string },
): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    fieldErrors[field] = options?.label ?? "Podaj liczbę całkowitą";
    return null;
  }
  if (options?.min !== undefined && parsed < options.min) {
    fieldErrors[field] =
      options.label ?? `Wartość nie może być mniejsza niż ${options.min}`;
    return null;
  }
  return parsed;
}

function parseOptionalNumber(
  raw: string,
  field: keyof NonNullable<IssueFormState["fieldErrors"]>,
  fieldErrors: NonNullable<IssueFormState["fieldErrors"]>,
): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors[field] = "Podaj nieujemną liczbę";
    return null;
  }
  return parsed;
}

function readIssueFields(formData: FormData, requireMagazine: boolean) {
  const magazineId = String(formData.get("magazineId") ?? "").trim();
  const issueNumberRaw = String(formData.get("issueNumber") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const fieldErrors: NonNullable<IssueFormState["fieldErrors"]> = {};

  if (requireMagazine && !magazineId) {
    fieldErrors.magazineId = "Magazyn jest wymagany";
  }

  let issueNumber = 0;
  if (!issueNumberRaw) {
    fieldErrors.issueNumber = "Numer wydania jest wymagany";
  } else {
    const parsed = Number(issueNumberRaw);
    if (!Number.isInteger(parsed)) {
      fieldErrors.issueNumber = "Podaj liczbę całkowitą";
    } else {
      issueNumber = parsed;
    }
  }

  let year = 0;
  if (!yearRaw) {
    fieldErrors.year = "Rok jest wymagany";
  } else {
    const parsed = Number(yearRaw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
      fieldErrors.year = "Podaj rok z zakresu 1900–2100";
    } else {
      year = parsed;
    }
  }

  const volume = parseOptionalInt(
    String(formData.get("volume") ?? "").trim(),
    "volume",
    fieldErrors,
  );
  const pageCount = parseOptionalInt(
    String(formData.get("pageCount") ?? "").trim(),
    "pageCount",
    fieldErrors,
    { min: 0 },
  );
  const coverPrice = parseOptionalNumber(
    String(formData.get("coverPrice") ?? "").trim(),
    "coverPrice",
    fieldErrors,
  );

  const statusRaw = String(formData.get("status") ?? "");
  const status = parseStatus(statusRaw);
  if (statusRaw.trim() && !status) {
    fieldErrors.status = "Nieprawidłowy status";
  }

  return {
    fieldErrors,
    magazineId,
    payload: {
      issueNumber,
      year,
      label: emptyToNull(String(formData.get("label") ?? "")),
      volume,
      coverDate: emptyToNull(String(formData.get("coverDate") ?? "")),
      onSaleDate: emptyToNull(String(formData.get("onSaleDate") ?? "")),
      pageCount,
      pageFormat: emptyToNull(String(formData.get("pageFormat") ?? "")),
      coverPrice,
      status,
      title: emptyToNull(String(formData.get("title") ?? "")),
      notes: emptyToNull(String(formData.get("notes") ?? "")),
    },
  };
}

async function ensureAuthenticated(): Promise<IssueFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

export async function createIssueAction(
  _prevState: IssueFormState,
  formData: FormData,
): Promise<IssueFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, magazineId, payload } = readIssueFields(formData, true);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const issue = await createIssue({
      ...payload,
      magazineId,
    });
    revalidatePath("/issues");
    redirect(`/issues/${issue.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateIssueAction(
  id: string,
  _prevState: IssueFormState,
  formData: FormData,
): Promise<IssueFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readIssueFields(formData, false);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  try {
    await updateIssue(id, {
      ...payload,
      active,
    });
    revalidatePath("/issues");
    revalidatePath(`/issues/${id}/edit`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteIssueAction(
  id: string,
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deleteIssue(id);
    revalidatePath("/issues");
    redirect("/issues");
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
