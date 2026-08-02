"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import {
  createMagazine,
  deleteMagazine,
  updateMagazine,
} from "@/lib/magazines/api";
import {
  MAGAZINE_FREQUENCIES,
  type MagazineFormState,
  type MagazineFrequency,
} from "@/lib/magazines/types";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseFrequency(value: string): MagazineFrequency | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (MAGAZINE_FREQUENCIES as readonly string[]).includes(trimmed)
    ? (trimmed as MagazineFrequency)
    : null;
}

function readMagazineFields(formData: FormData, requirePublisher: boolean) {
  const name = String(formData.get("name") ?? "").trim();
  const publisherId = String(formData.get("publisherId") ?? "").trim();
  const defaultPageCountRaw = String(
    formData.get("defaultPageCount") ?? "",
  ).trim();
  const fieldErrors: NonNullable<MagazineFormState["fieldErrors"]> = {};

  if (!name) {
    fieldErrors.name = "Nazwa jest wymagana";
  }

  if (requirePublisher && !publisherId) {
    fieldErrors.publisherId = "Wydawca jest wymagany";
  }

  let defaultPageCount: number | null = null;
  if (defaultPageCountRaw) {
    const parsed = Number(defaultPageCountRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      fieldErrors.defaultPageCount = "Podaj nieujemną liczbę całkowitą";
    } else {
      defaultPageCount = parsed;
    }
  }

  return {
    fieldErrors,
    publisherId,
    payload: {
      name,
      shortName: emptyToNull(String(formData.get("shortName") ?? "")),
      issn: emptyToNull(String(formData.get("issn") ?? "")),
      eissn: emptyToNull(String(formData.get("eissn") ?? "")),
      frequency: parseFrequency(String(formData.get("frequency") ?? "")),
      language: emptyToNull(String(formData.get("language") ?? "")),
      pageFormat: emptyToNull(String(formData.get("pageFormat") ?? "")),
      defaultPageCount,
      description: emptyToNull(String(formData.get("description") ?? "")),
      notes: emptyToNull(String(formData.get("notes") ?? "")),
    },
  };
}

async function ensureAuthenticated(): Promise<MagazineFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

export async function createMagazineAction(
  _prevState: MagazineFormState,
  formData: FormData,
): Promise<MagazineFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, publisherId, payload } = readMagazineFields(
    formData,
    true,
  );
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const magazine = await createMagazine({
      ...payload,
      publisherId,
    });
    revalidatePath("/magazines");
    redirect(`/magazines/${magazine.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateMagazineAction(
  id: string,
  _prevState: MagazineFormState,
  formData: FormData,
): Promise<MagazineFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readMagazineFields(formData, false);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  try {
    await updateMagazine(id, {
      ...payload,
      active,
    });
    revalidatePath("/magazines");
    revalidatePath(`/magazines/${id}/edit`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteMagazineAction(
  id: string,
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deleteMagazine(id);
    revalidatePath("/magazines");
    redirect("/magazines");
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
