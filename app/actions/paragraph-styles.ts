"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import {
  createParagraphStyle,
  deleteParagraphStyle,
  updateParagraphStyle,
} from "@/lib/paragraph-styles/api";
import {
  PARAGRAPH_STYLE_FONT_WEIGHTS,
  PARAGRAPH_STYLE_HTML_TAGS,
  PARAGRAPH_STYLE_TEXT_ALIGNS,
  type ParagraphStyleFontWeight,
  type ParagraphStyleFormState,
  type ParagraphStyleHtmlTag,
  type ParagraphStyleTextAlign,
} from "@/lib/paragraph-styles/types";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseHtmlTag(value: string): ParagraphStyleHtmlTag | null {
  const trimmed = value.trim();
  return (PARAGRAPH_STYLE_HTML_TAGS as readonly string[]).includes(trimmed)
    ? (trimmed as ParagraphStyleHtmlTag)
    : null;
}

function parseFontWeight(value: string): ParagraphStyleFontWeight | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (PARAGRAPH_STYLE_FONT_WEIGHTS as readonly string[]).includes(trimmed)
    ? (trimmed as ParagraphStyleFontWeight)
    : null;
}

function parseTextAlign(value: string): ParagraphStyleTextAlign | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (PARAGRAPH_STYLE_TEXT_ALIGNS as readonly string[]).includes(trimmed)
    ? (trimmed as ParagraphStyleTextAlign)
    : null;
}

function parseRequiredInt(
  raw: string,
  field: "charactersPerModule",
  fieldErrors: NonNullable<ParagraphStyleFormState["fieldErrors"]>,
) {
  if (!raw) {
    fieldErrors[field] = "Pole jest wymagane";
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    fieldErrors[field] = "Podaj liczbę całkowitą";
    return null;
  }
  return parsed;
}

function parseRequiredNumber(
  raw: string,
  field: "fontSize",
  fieldErrors: NonNullable<ParagraphStyleFormState["fieldErrors"]>,
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

function parseOptionalNumber(
  raw: string,
  field: "lineHeight" | "sortOrder",
  fieldErrors: NonNullable<ParagraphStyleFormState["fieldErrors"]>,
  options?: { integer?: boolean; min?: number },
) {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    fieldErrors[field] = "Podaj prawidłową liczbę";
    return null;
  }
  if (options?.integer && !Number.isInteger(parsed)) {
    fieldErrors[field] = "Podaj liczbę całkowitą";
    return null;
  }
  if (options?.min != null && parsed < options.min) {
    fieldErrors[field] = `Wartość musi być ≥ ${options.min}`;
    return null;
  }
  return parsed;
}

function readParagraphStyleFields(formData: FormData) {
  const configurationId = String(formData.get("configurationId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const cssClass = String(formData.get("cssClass") ?? "").trim();
  const indesignStyleName = String(
    formData.get("indesignStyleName") ?? "",
  ).trim();
  const htmlTag = parseHtmlTag(String(formData.get("htmlTag") ?? ""));
  const fontWeightRaw = String(formData.get("fontWeight") ?? "");
  const textAlignRaw = String(formData.get("textAlign") ?? "");

  const fieldErrors: NonNullable<ParagraphStyleFormState["fieldErrors"]> = {};

  if (!configurationId) {
    fieldErrors.configurationId = "Wybierz konfigurację";
  }
  if (!name) {
    fieldErrors.name = "Nazwa jest wymagana";
  }
  if (!slug) {
    fieldErrors.slug = "Slug jest wymagany";
  }
  if (!htmlTag) {
    fieldErrors.htmlTag = "Wybierz tag HTML";
  }
  if (!cssClass) {
    fieldErrors.cssClass = "Klasa CSS jest wymagana";
  }
  if (!indesignStyleName) {
    fieldErrors.indesignStyleName = "Nazwa stylu InDesign jest wymagana";
  }

  const fontWeight = parseFontWeight(fontWeightRaw);
  if (fontWeightRaw.trim() && !fontWeight) {
    fieldErrors.fontWeight = "Nieprawidłowa grubość fontu";
  }

  const textAlign = parseTextAlign(textAlignRaw);
  if (textAlignRaw.trim() && !textAlign) {
    fieldErrors.textAlign = "Nieprawidłowe wyrównanie";
  }

  const charactersPerModule = parseRequiredInt(
    String(formData.get("charactersPerModule") ?? "").trim(),
    "charactersPerModule",
    fieldErrors,
  );
  const fontSize = parseRequiredNumber(
    String(formData.get("fontSize") ?? "").trim(),
    "fontSize",
    fieldErrors,
  );
  const lineHeight = parseOptionalNumber(
    String(formData.get("lineHeight") ?? "").trim(),
    "lineHeight",
    fieldErrors,
    { min: 0 },
  );
  const sortOrder = parseOptionalNumber(
    String(formData.get("sortOrder") ?? "").trim(),
    "sortOrder",
    fieldErrors,
    { integer: true },
  );

  return {
    fieldErrors,
    payload:
      htmlTag &&
      charactersPerModule != null &&
      fontSize != null &&
      configurationId &&
      name &&
      slug &&
      cssClass &&
      indesignStyleName
        ? {
            configurationId,
            name,
            slug,
            description: emptyToNull(String(formData.get("description") ?? "")),
            htmlTag,
            cssClass,
            indesignStyleName,
            charactersPerModule,
            fontSize,
            fontFamily: emptyToNull(String(formData.get("fontFamily") ?? "")),
            fontWeight,
            lineHeight,
            textAlign,
            color: emptyToNull(String(formData.get("color") ?? "")),
            sortOrder,
          }
        : null,
  };
}

async function ensureAuthenticated(): Promise<ParagraphStyleFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidateParagraphStylePaths(
  configurationId?: string | null,
  styleId?: string,
) {
  revalidatePath("/paragraph-styles");
  if (styleId) {
    revalidatePath(`/paragraph-styles/${styleId}/edit`);
  }
  if (configurationId) {
    revalidatePath(`/configurations/${configurationId}/edit`);
  }
  revalidatePath("/configurations");
}

export async function createParagraphStyleAction(
  _prevState: ParagraphStyleFormState,
  formData: FormData,
): Promise<ParagraphStyleFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readParagraphStyleFields(formData);
  if (Object.keys(fieldErrors).length > 0 || !payload) {
    return { fieldErrors };
  }

  try {
    const style = await createParagraphStyle(payload);
    revalidateParagraphStylePaths(payload.configurationId, style.id);
    redirect(`/paragraph-styles/${style.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateParagraphStyleAction(
  id: string,
  _prevState: ParagraphStyleFormState,
  formData: FormData,
): Promise<ParagraphStyleFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = readParagraphStyleFields(formData);
  if (Object.keys(fieldErrors).length > 0 || !payload) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  try {
    await updateParagraphStyle(id, {
      ...payload,
      active,
    });
    revalidateParagraphStylePaths(payload.configurationId, id);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteParagraphStyleAction(
  id: string,
  configurationId?: string,
  redirectTo = "/paragraph-styles",
): Promise<{ error?: string }> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  try {
    await deleteParagraphStyle(id);
    revalidateParagraphStylePaths(configurationId);
    redirect(redirectTo);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
