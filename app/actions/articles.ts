"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  createArticle,
  updateArticle,
} from "@/lib/articles/api";
import {
  ARTICLE_STATUSES,
  type ArticleFormState,
  type ArticleStatus,
} from "@/lib/articles/types";
import { getAccessToken } from "@/lib/auth/session";
import { getIssue } from "@/lib/issues/api";
import { safeReturnTo } from "@/lib/navigation/returnTo";
import { getSection } from "@/lib/sections/api";

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStatus(value: string): ArticleStatus | undefined {
  return ARTICLE_STATUSES.includes(value as ArticleStatus)
    ? (value as ArticleStatus)
    : undefined;
}

function parseSectionIds(formData: FormData) {
  return formData
    .getAll("sectionIdList")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

async function resolveMagazineId(
  magazineId: string,
  sectionIdList: string[],
): Promise<{ magazineId?: string; error?: string }> {
  if (magazineId) {
    return { magazineId };
  }

  if (sectionIdList.length === 0) {
    return {};
  }

  try {
    const magazineIds = new Set<string>();
    for (const sectionId of sectionIdList) {
      const section = await getSection(sectionId);
      const issue = await getIssue(section.issueId);
      magazineIds.add(issue.magazineId);
    }

    if (magazineIds.size > 1) {
      return {
        error: "Wybrane grzbiety należą do różnych magazynów.",
      };
    }

    return { magazineId: [...magazineIds][0] };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

async function readArticleFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const plainContent = content
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  const magazineIdRaw = String(formData.get("magazineId") ?? "").trim();
  const sectionIdList = parseSectionIds(formData);

  const fieldErrors: NonNullable<ArticleFormState["fieldErrors"]> = {};
  if (!title) {
    fieldErrors.title = "Tytuł jest wymagany";
  }
  if (!plainContent) {
    fieldErrors.content = "Treść jest wymagana";
  }
  if (!magazineIdRaw && sectionIdList.length === 0) {
    fieldErrors.binding =
      "Przypisz artykuł do magazynu albo do grzbietu przed zapisem.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const resolved = await resolveMagazineId(magazineIdRaw, sectionIdList);
  if (resolved.error) {
    return { fieldErrors: { binding: resolved.error } };
  }
  if (!resolved.magazineId) {
    return {
      fieldErrors: {
        binding:
          "Przypisz artykuł do magazynu albo do grzbietu przed zapisem.",
      },
    };
  }

  return {
    fieldErrors: {},
    payload: {
      magazineId: resolved.magazineId,
      title,
      content,
      kicker: emptyToNull(String(formData.get("kicker") ?? "")),
      subtitle: emptyToNull(String(formData.get("subtitle") ?? "")),
      lead: emptyToNull(String(formData.get("lead") ?? "")),
      byline: emptyToNull(String(formData.get("byline") ?? "")),
      notes: emptyToNull(String(formData.get("notes") ?? "")),
      status: parseStatus(String(formData.get("status") ?? "")),
      sectionIdList,
    },
  };
}

async function ensureAuthenticated(): Promise<ArticleFormState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = await readArticleFields(formData);
  if (!payload || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const article = await createArticle({
      ...payload,
      status: payload.status ?? "DRAFT",
    });
    revalidatePath("/articles");
    redirect(`/articles/${article.id}/edit`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function updateArticleAction(
  id: string,
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const { fieldErrors, payload } = await readArticleFields(formData);
  if (!payload || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const activeRaw = String(formData.get("active") ?? "true");
  const active = activeRaw === "true";

  const returnTo = safeReturnTo(formData.get("returnTo"));

  try {
    await updateArticle(id, {
      ...payload,
      status: payload.status ?? "DRAFT",
      active,
    });
    revalidatePath("/articles");
    revalidatePath(`/articles/${id}/edit`);
    if (returnTo) {
      revalidatePath(returnTo);
      redirect(returnTo);
    }
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
