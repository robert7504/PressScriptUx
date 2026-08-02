import "server-only";

import { apiFetch, apiFetchBinary } from "../api/client";
import type { ArticleImage, ArticleImagePatchInput } from "../articles/types";

export type ListMagazineImagesParams = {
  unassignedOnly?: boolean;
};

export async function listMagazineImages(
  magazineId: string,
  params: ListMagazineImagesParams = {},
) {
  return apiFetch<ArticleImage[]>(`/magazines/${magazineId}/images`, {
    method: "GET",
    searchParams: {
      unassignedOnly: params.unassignedOnly,
    },
  });
}

export async function uploadMagazineImage(
  magazineId: string,
  file: FormData,
  options: {
    modulesX?: number;
    modulesY?: number;
    title?: string;
    description?: string;
  } = {},
) {
  return apiFetch<ArticleImage>(`/magazines/${magazineId}/images`, {
    method: "POST",
    body: file,
    searchParams: {
      modulesX: options.modulesX,
      modulesY: options.modulesY,
      title: options.title,
      description: options.description,
    },
  });
}

export async function patchMagazineImage(
  magazineId: string,
  imageId: string,
  input: ArticleImagePatchInput,
) {
  return apiFetch<ArticleImage>(
    `/magazines/${magazineId}/images/${imageId}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export async function deleteMagazineImage(
  magazineId: string,
  imageId: string,
) {
  return apiFetch<void>(`/magazines/${magazineId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function getMagazineImageContent(
  magazineId: string,
  imageId: string,
) {
  return apiFetchBinary(
    `/magazines/${magazineId}/images/${imageId}/content`,
    { method: "GET" },
  );
}

export async function replaceMagazineImageContent(
  magazineId: string,
  imageId: string,
  file: FormData,
) {
  return apiFetch<ArticleImage>(
    `/magazines/${magazineId}/images/${imageId}/content`,
    {
      method: "PUT",
      body: file,
    },
  );
}
