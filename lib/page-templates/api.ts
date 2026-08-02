import "server-only";

import { apiFetch } from "../api/client";
import type {
  PageTemplate,
  PageTemplateCreateInput,
  PageTemplateUpdateInput,
} from "./types";

export type ListPageTemplatesParams = {
  active?: boolean;
  configurationId?: string;
  slug?: string;
};

export async function listPageTemplates(params: ListPageTemplatesParams = {}) {
  return apiFetch<PageTemplate[]>("/page-templates", {
    method: "GET",
    searchParams: {
      active: params.active,
      configurationId: params.configurationId,
      slug: params.slug,
    },
  });
}

export async function getPageTemplate(id: string) {
  return apiFetch<PageTemplate>(`/page-templates/${id}`, {
    method: "GET",
  });
}

export async function createPageTemplate(input: PageTemplateCreateInput) {
  return apiFetch<PageTemplate>("/page-templates", {
    method: "POST",
    body: input,
  });
}

export async function updatePageTemplate(
  id: string,
  input: PageTemplateUpdateInput,
) {
  return apiFetch<PageTemplate>(`/page-templates/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deletePageTemplate(id: string) {
  return apiFetch<void>(`/page-templates/${id}`, {
    method: "DELETE",
  });
}
