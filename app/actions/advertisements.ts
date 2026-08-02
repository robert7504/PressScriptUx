"use server";

import { revalidatePath } from "next/cache";
import {
  deleteAdvertisement,
  patchAdvertisement,
  replaceAdvertisementContent,
  uploadAdvertisement,
} from "@/lib/advertisements/api";
import {
  ADVERTISEMENT_STATUSES,
  type AdvertisementActionState,
  type AdvertisementStatus,
} from "@/lib/advertisements/types";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";

async function ensureAuthenticated(): Promise<AdvertisementActionState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidateAdvertisementPaths() {
  revalidatePath("/advertisements");
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStatus(
  raw: string,
): AdvertisementStatus | undefined | { error: string } {
  const value = raw.trim();
  if (!value) return undefined;
  if ((ADVERTISEMENT_STATUSES as readonly string[]).includes(value)) {
    return value as AdvertisementStatus;
  }
  return { error: "Nieprawidłowy status reklamy." };
}

function isAllowedAdFile(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (name.endsWith(".pdf") || name.endsWith(".eps")) return true;
  if (type === "application/pdf" || type === "application/postscript") {
    return true;
  }
  return false;
}

export async function uploadAdvertisementAction(
  magazineId: string,
  formData: FormData,
): Promise<AdvertisementActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = magazineId.trim();
  if (!id) {
    return { error: "Brak identyfikatora magazynu." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Wybierz plik reklamy (PDF lub EPS)." };
  }
  if (!isAllowedAdFile(file)) {
    return { error: "Dozwolone są tylko pliki PDF lub EPS." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Tytuł jest wymagany." };
  }
  if (title.length > 512) {
    return { error: "Tytuł może mieć co najwyżej 512 znaków." };
  }

  const advertiser = emptyToNull(String(formData.get("advertiser") ?? ""));
  const notes = emptyToNull(String(formData.get("notes") ?? ""));
  const statusResult = parseStatus(String(formData.get("status") ?? ""));
  if (statusResult && typeof statusResult === "object" && "error" in statusResult) {
    return { error: statusResult.error };
  }

  const uploadBody = new FormData();
  uploadBody.append("file", file);

  try {
    await uploadAdvertisement(id, uploadBody, {
      title,
      advertiser: advertiser ?? undefined,
      notes: notes ?? undefined,
      status: statusResult,
    });
    revalidateAdvertisementPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się przesłać reklamy.",
    };
  }
}

export async function updateAdvertisementAction(
  advertisementId: string,
  formData: FormData,
): Promise<AdvertisementActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = advertisementId.trim();
  if (!id) {
    return { error: "Brak identyfikatora reklamy." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Tytuł jest wymagany." };
  }
  if (title.length > 512) {
    return { error: "Tytuł może mieć co najwyżej 512 znaków." };
  }

  const advertiser = emptyToNull(String(formData.get("advertiser") ?? ""));
  const notes = emptyToNull(String(formData.get("notes") ?? ""));
  const statusResult = parseStatus(String(formData.get("status") ?? ""));
  if (statusResult && typeof statusResult === "object" && "error" in statusResult) {
    return { error: statusResult.error };
  }
  if (!statusResult) {
    return { error: "Status jest wymagany." };
  }

  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (hasFile && !isAllowedAdFile(file)) {
    return { error: "Dozwolone są tylko pliki PDF lub EPS." };
  }

  try {
    if (hasFile) {
      const uploadBody = new FormData();
      uploadBody.append("file", file);
      await replaceAdvertisementContent(id, uploadBody);
    }
    await patchAdvertisement(id, {
      title,
      advertiser,
      notes,
      status: statusResult,
    });
    revalidateAdvertisementPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się zaktualizować reklamy.",
    };
  }
}

export async function deleteAdvertisementAction(
  advertisementId: string,
): Promise<AdvertisementActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = advertisementId.trim();
  if (!id) {
    return { error: "Brak identyfikatora reklamy." };
  }

  try {
    await deleteAdvertisement(id);
    revalidateAdvertisementPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
