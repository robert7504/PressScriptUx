"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import {
  createPageTemplate,
  deletePageTemplate,
  updatePageTemplate,
} from "@/lib/page-templates/api";
import {
  PAGE_TEMPLATE_COLOR_MODES,
  PAGE_TEMPLATE_ORIENTATIONS,
  PAGE_TEMPLATE_PAGE_SIDES,
  PAGE_TEMPLATE_UNITS,
  type PageTemplateColorMode,
  type PageTemplateFormState,
  type PageTemplateOrientation,
  type PageTemplatePageSide,
  type PageTemplateUnit,
} from "@/lib/page-templates/types";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseUnit(value: string): PageTemplateUnit | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (PAGE_TEMPLATE_UNITS as readonly string[]).includes(trimmed)
    ? (trimmed as PageTemplateUnit)
    : null;
}

function parseOrientation(value: string): PageTemplateOrientation | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (PAGE_TEMPLATE_ORIENTATIONS as readonly string[]).includes(trimmed)
    ? (trimmed as PageTemplateOrientation)
    : null;
}

function parsePageSide(value: string): PageTemplatePageSide | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (PAGE_TEMPLATE_PAGE_SIDES as readonly string[]).includes(trimmed)
    ? (trimmed as PageTemplatePageSide)
    : null;
}

function parseColorMode(value: string): PageTemplateColorMode | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (PAGE_TEMPLATE_COLOR_MODES as readonly string[]).includes(trimmed)
    ? (trimmed as PageTemplateColorMode)
    : null;
}

function parseRequiredPositiveInt(
  raw: string,
  field: "modulesX" | "modulesY",
  fieldErrors: NonNullable<PageTemplateFormState["fieldErrors"]>,
) {
  if (!raw) {
    fieldErrors[field] = "Pole jest wymagane";
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fieldErrors[field] = "Podaj liczbę całkowitą większą od 0";
    return null;
  }
  return parsed;
}

function parseRequiredPositiveNumber(
  raw: string,
  field: "width" | "height",
  fieldErrors: NonNullable<PageTemplateFormState["fieldErrors"]>,
) {
  if (!raw) {
    fieldErrors[field] = "Pole jest wymagane";
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    fieldErrors[field] = "Podaj liczbę większą od 0";
    return null;
  }
  return parsed;
}

function parseRequiredNonNegativeNumber(
  raw: string,
  field: "moduleGapX" | "moduleGapY",
  fieldErrors: NonNullable<PageTemplateFormState["fieldErrors"]>,
) {
  if (!raw) {
    fieldErrors[field] = "Pole jest wymagane";
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors[field] = "Podaj liczbę ≥ 0";
    return null;
  }
  return parsed;
}

function parseOptionalNonNegativeNumber(
  raw: string,
  field:
    | "marginTop"
    | "marginRight"
    | "marginBottom"
    | "marginLeft"
    | "bleed",
  fieldErrors: NonNullable<PageTemplateFormState["fieldErrors"]>,
) {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors[field] = "Podaj liczbę ≥ 0";
    return null;
  }
  return parsed;
}

function readPageTemplateFields(formData: FormData) {
  const configurationId = String(formData.get("configurationId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "");
  const orientationRaw = String(formData.get("orientation") ?? "");
  const pageSideRaw = String(formData.get("pageSide") ?? "");
  const colorModeRaw = String(formData.get("colorMode") ?? "");

  const fieldErrors: NonNullable<PageTemplateFormState["fieldErrors"]> = {};

  if (!configurationId) {
    fieldErrors.configurationId = "Wybierz konfigurację";
  }
  if (!name) {
    fieldErrors.name = "Nazwa jest wymagana";
  }
  if (!slug) {
    fieldErrors.slug = "Slug jest wymagany";
  }

  const unit = parseUnit(unitRaw);
  if (unitRaw.trim() && !unit) {
    fieldErrors.unit = "Nieprawidłowa jednostka";
  }

  const orientation = parseOrientation(orientationRaw);
  if (orientationRaw.trim() && !orientation) {
    fieldErrors.orientation = "Nieprawidłowa orientacja";
  }

  const pageSide = parsePageSide(pageSideRaw);
  if (pageSideRaw.trim() && !pageSide) {
    fieldErrors.pageSide = "Nieprawidłowa strona";
  }

  const colorMode = parseColorMode(colorModeRaw);
  if (colorModeRaw.trim() && !colorMode) {
    fieldErrors.colorMode = "Nieprawidłowy tryb koloru";
  }

  const width = parseRequiredPositiveNumber(
    String(formData.get("width") ?? "").trim(),
    "width",
    fieldErrors,
  );
  const height = parseRequiredPositiveNumber(
    String(formData.get("height") ?? "").trim(),
    "height",
    fieldErrors,
  );
  const modulesX = parseRequiredPositiveInt(
    String(formData.get("modulesX") ?? "").trim(),
    "modulesX",
    fieldErrors,
  );
  const modulesY = parseRequiredPositiveInt(
    String(formData.get("modulesY") ?? "").trim(),
    "modulesY",
    fieldErrors,
  );
  const moduleGapX = parseRequiredNonNegativeNumber(
    String(formData.get("moduleGapX") ?? "").trim(),
    "moduleGapX",
    fieldErrors,
  );
  const moduleGapY = parseRequiredNonNegativeNumber(
    String(formData.get("moduleGapY") ?? "").trim(),
    "moduleGapY",
    fieldErrors,
  );
  const marginTop = parseOptionalNonNegativeNumber(
    String(formData.get("marginTop") ?? "").trim(),
    "marginTop",
    fieldErrors,
  );
  const marginRight = parseOptionalNonNegativeNumber(
    String(formData.get("marginRight") ?? "").trim(),
    "marginRight",
    fieldErrors,
  );
  const marginBottom = parseOptionalNonNegativeNumber(
    String(formData.get("marginBottom") ?? "").trim(),
    "marginBottom",
    fieldErrors,
  );
  const marginLeft = parseOptionalNonNegativeNumber(
    String(formData.get("marginLeft") ?? "").trim(),
    "marginLeft",
    fieldErrors,
  );
  const bleed = parseOptionalNonNegativeNumber(
    String(formData.get("bleed") ?? "").trim(),
    "bleed",
    fieldErrors,
  );

  return {
    fieldErrors,
    payload:
      configurationId &&
      name &&
      slug &&
      width != null &&
      height != null &&
      modulesX != null &&
      modulesY != null &&
      moduleGapX != null &&
      moduleGapY != null
        ? {
            configurationId,
            name,
            slug,
            description: emptyToNull(String(formData.get("description") ?? "")),
            unit,
            width,
            height,
            modulesX,
            modulesY,
            moduleGapX,
            moduleGapY,
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            bleed,
            orientation,
            pageSide,
            colorMode,
            notes: emptyToNull(String(formData.get("notes") ?? "")),
          }
        : null,
  };
}

async function ensureAuthenticated(): Promise<PageTemplateFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidatePageTemplatePaths(
  configurationId?: string | null,
  templateId?: string,
) {
  revalidatePath("/page-templates");
  if (templateId) {
    revalidatePath(`/page-templates/${templateId}/edit`);
  }
  if (configurationId) {
    revalidatePath(`/configurations/${configurationId}/edit`);
  }
  revalidatePath("/configurations");
}

export async function createPageTemplateAction(
  _prevState: PageTemplateFormState,
  formData: FormData,
): Promise<PageTemplateFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readPageTemplateFields(formData);
  if (Object.keys(fieldErrors).length > 0 || !payload) {
    return { fieldErrors };
  }

  try {
    const template = await createPageTemplate(payload);
    revalidatePageTemplatePaths(payload.configurationId, template.id);
    redirect(`/page-templates/${template.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updatePageTemplateAction(
  id: string,
  _prevState: PageTemplateFormState,
  formData: FormData,
): Promise<PageTemplateFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readPageTemplateFields(formData);
  if (Object.keys(fieldErrors).length > 0 || !payload) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  try {
    await updatePageTemplate(id, {
      ...payload,
      active,
    });
    revalidatePageTemplatePaths(payload.configurationId, id);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deletePageTemplateAction(
  id: string,
  configurationId?: string,
  redirectTo = "/page-templates",
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deletePageTemplate(id);
    revalidatePageTemplatePaths(configurationId);
    redirect(redirectTo);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
