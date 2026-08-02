import "server-only";

import { apiFetch } from "../api/client";
import type {
  ParagraphStyle,
  ParagraphStyleCreateInput,
  ParagraphStyleUpdateInput,
} from "./types";

export type ListParagraphStylesParams = {
  active?: boolean;
  configurationId?: string;
};

export async function listParagraphStyles(
  params: ListParagraphStylesParams = {},
) {
  return apiFetch<ParagraphStyle[]>("/paragraph-styles", {
    method: "GET",
    searchParams: {
      active: params.active,
      configurationId: params.configurationId,
    },
  });
}

export async function getParagraphStyle(id: string) {
  return apiFetch<ParagraphStyle>(`/paragraph-styles/${id}`, {
    method: "GET",
  });
}

export async function createParagraphStyle(input: ParagraphStyleCreateInput) {
  return apiFetch<ParagraphStyle>("/paragraph-styles", {
    method: "POST",
    body: input,
  });
}

export async function updateParagraphStyle(
  id: string,
  input: ParagraphStyleUpdateInput,
) {
  return apiFetch<ParagraphStyle>(`/paragraph-styles/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteParagraphStyle(id: string) {
  return apiFetch<void>(`/paragraph-styles/${id}`, {
    method: "DELETE",
  });
}
