import "server-only";

import { apiFetch } from "../api/client";
import type { Page, PagesFromTemplateInput } from "./types";

export type ListPagesParams = {
  active?: boolean;
  sectionId?: string;
};

export async function listPages(params: ListPagesParams = {}) {
  return apiFetch<Page[]>("/pages", {
    method: "GET",
    searchParams: {
      active: params.active,
      sectionId: params.sectionId,
    },
  });
}

export async function getPage(id: string) {
  return apiFetch<Page>(`/pages/${id}`, { method: "GET" });
}

export async function createPagesFromTemplate(
  sectionId: string,
  input: PagesFromTemplateInput,
) {
  return apiFetch<Page[]>(`/sections/${sectionId}/pages/from-template`, {
    method: "POST",
    body: input,
  });
}

export async function deletePage(id: string) {
  return apiFetch<void>(`/pages/${id}`, { method: "DELETE" });
}
