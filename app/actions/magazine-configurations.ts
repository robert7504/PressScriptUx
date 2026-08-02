"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import {
  createMagazineConfiguration,
  deleteMagazineConfiguration,
  updateMagazineConfiguration,
} from "@/lib/magazine-configurations/api";
import {
  MAGAZINE_CONFIGURATION_TYPES,
  type MagazineConfigurationFormState,
  type MagazineConfigurationType,
} from "@/lib/magazine-configurations/types";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseType(value: string): MagazineConfigurationType | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (MAGAZINE_CONFIGURATION_TYPES as readonly string[]).includes(trimmed)
    ? (trimmed as MagazineConfigurationType)
    : null;
}

function parseOptionalInt(
  raw: string,
  field: "version" | "priority",
  fieldErrors: NonNullable<MagazineConfigurationFormState["fieldErrors"]>,
  options?: { min?: number },
) {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    fieldErrors[field] = "Podaj liczbę całkowitą";
    return null;
  }
  if (options?.min != null && parsed < options.min) {
    fieldErrors[field] = `Wartość musi być ≥ ${options.min}`;
    return null;
  }
  return parsed;
}

function parseDateTime(
  raw: string,
  field: "validFrom" | "validTo",
  fieldErrors: NonNullable<MagazineConfigurationFormState["fieldErrors"]>,
) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    fieldErrors[field] = "Nieprawidłowa data";
    return null;
  }
  return date.toISOString();
}

function parsePayload(
  raw: string,
  fieldErrors: NonNullable<MagazineConfigurationFormState["fieldErrors"]>,
) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      fieldErrors.payload = "Payload musi być obiektem JSON";
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    fieldErrors.payload = "Nieprawidłowy JSON";
    return null;
  }
}

function readConfigurationFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const magazineIdList = formData
    .getAll("magazineIdList")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const fieldErrors: NonNullable<
    MagazineConfigurationFormState["fieldErrors"]
  > = {};

  if (!name) {
    fieldErrors.name = "Nazwa jest wymagana";
  }
  if (!slug) {
    fieldErrors.slug = "Slug jest wymagany";
  }
  if (magazineIdList.length === 0) {
    fieldErrors.magazineIdList = "Wybierz co najmniej jeden magazyn";
  }

  const version = parseOptionalInt(
    String(formData.get("version") ?? "").trim(),
    "version",
    fieldErrors,
    { min: 1 },
  );
  const priority = parseOptionalInt(
    String(formData.get("priority") ?? "").trim(),
    "priority",
    fieldErrors,
  );
  const validFrom = parseDateTime(
    String(formData.get("validFrom") ?? "").trim(),
    "validFrom",
    fieldErrors,
  );
  const validTo = parseDateTime(
    String(formData.get("validTo") ?? "").trim(),
    "validTo",
    fieldErrors,
  );
  const payload = parsePayload(
    String(formData.get("payload") ?? ""),
    fieldErrors,
  );

  return {
    fieldErrors,
    payload: {
      name,
      slug,
      description: emptyToNull(String(formData.get("description") ?? "")),
      type: parseType(String(formData.get("type") ?? "")),
      version,
      priority,
      payload,
      schemaKey: emptyToNull(String(formData.get("schemaKey") ?? "")),
      validFrom,
      validTo,
      notes: emptyToNull(String(formData.get("notes") ?? "")),
      magazineIdList,
    },
  };
}

async function ensureAuthenticated(): Promise<MagazineConfigurationFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

export async function createMagazineConfigurationAction(
  _prevState: MagazineConfigurationFormState,
  formData: FormData,
): Promise<MagazineConfigurationFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readConfigurationFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const configuration = await createMagazineConfiguration(payload);
    revalidatePath("/configurations");
    redirect(`/configurations/${configuration.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateMagazineConfigurationAction(
  id: string,
  _prevState: MagazineConfigurationFormState,
  formData: FormData,
): Promise<MagazineConfigurationFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readConfigurationFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  try {
    await updateMagazineConfiguration(id, {
      ...payload,
      active,
    });
    revalidatePath("/configurations");
    revalidatePath(`/configurations/${id}/edit`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteMagazineConfigurationAction(
  id: string,
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deleteMagazineConfiguration(id);
    revalidatePath("/configurations");
    redirect("/configurations");
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
