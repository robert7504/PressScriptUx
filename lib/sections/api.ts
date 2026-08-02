import "server-only";

import { apiFetch } from "../api/client";
import type {
  Section,
  SectionCreateInput,
  SectionUpdateInput,
} from "./types";

export type ListSectionsParams = {
  active?: boolean;
  issueId?: string;
};

export async function listSections(params: ListSectionsParams = {}) {
  return apiFetch<Section[]>("/sections", {
    method: "GET",
    searchParams: {
      active: params.active,
      issueId: params.issueId,
    },
  });
}

export async function getSection(id: string) {
  return apiFetch<Section>(`/sections/${id}`, { method: "GET" });
}

export async function createSection(input: SectionCreateInput) {
  return apiFetch<Section>("/sections", {
    method: "POST",
    body: input,
  });
}

export async function updateSection(id: string, input: SectionUpdateInput) {
  return apiFetch<Section>(`/sections/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteSection(id: string) {
  return apiFetch<void>(`/sections/${id}`, { method: "DELETE" });
}
