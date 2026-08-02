"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  createPublisher,
  deletePublisher,
  updatePublisher,
} from "@/lib/publishers/api";
import type { PublisherFormState } from "@/lib/publishers/types";
import { getAccessToken } from "@/lib/auth/session";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readPublisherFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const fieldErrors: NonNullable<PublisherFormState["fieldErrors"]> = {};

  if (!name) {
    fieldErrors.name = "Nazwa jest wymagana";
  }

  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    fieldErrors.email = "Nieprawidłowy adres e-mail";
  }

  return {
    fieldErrors,
    payload: {
      name,
      shortName: emptyToNull(String(formData.get("shortName") ?? "")),
      taxId: emptyToNull(String(formData.get("taxId") ?? "")),
      regon: emptyToNull(String(formData.get("regon") ?? "")),
      email: emptyToNull(emailRaw),
      phone: emptyToNull(String(formData.get("phone") ?? "")),
      website: emptyToNull(String(formData.get("website") ?? "")),
      street: emptyToNull(String(formData.get("street") ?? "")),
      postalCode: emptyToNull(String(formData.get("postalCode") ?? "")),
      city: emptyToNull(String(formData.get("city") ?? "")),
      country: emptyToNull(String(formData.get("country") ?? "")),
      notes: emptyToNull(String(formData.get("notes") ?? "")),
    },
  };
}

async function ensureAuthenticated(): Promise<PublisherFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

export async function createPublisherAction(
  _prevState: PublisherFormState,
  formData: FormData,
): Promise<PublisherFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readPublisherFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const publisher = await createPublisher(payload);
    revalidatePath("/publishers");
    redirect(`/publishers/${publisher.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updatePublisherAction(
  id: string,
  _prevState: PublisherFormState,
  formData: FormData,
): Promise<PublisherFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readPublisherFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  try {
    await updatePublisher(id, {
      ...payload,
      active,
    });
    revalidatePath("/publishers");
    revalidatePath(`/publishers/${id}/edit`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deletePublisherAction(
  id: string,
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deletePublisher(id);
    revalidatePath("/publishers");
    redirect("/publishers");
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
