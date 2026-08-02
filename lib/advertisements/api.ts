import "server-only";

import { apiFetch, apiFetchBinary } from "../api/client";
import type {
  Advertisement,
  AdvertisementPatchInput,
  AdvertisementUploadOptions,
} from "./types";

export type ListMagazineAdvertisementsParams = {
  active?: boolean;
  q?: string;
};

export async function listMagazineAdvertisements(
  magazineId: string,
  params: ListMagazineAdvertisementsParams = {},
) {
  return apiFetch<Advertisement[]>(`/magazines/${magazineId}/advertisements`, {
    method: "GET",
    searchParams: {
      active: params.active,
      q: params.q,
    },
  });
}

export async function uploadAdvertisement(
  magazineId: string,
  file: FormData,
  options: AdvertisementUploadOptions,
) {
  return apiFetch<Advertisement>(`/magazines/${magazineId}/advertisements`, {
    method: "POST",
    body: file,
    searchParams: {
      title: options.title,
      advertiser: options.advertiser,
      notes: options.notes,
      status: options.status,
    },
  });
}

export async function getAdvertisement(id: string) {
  return apiFetch<Advertisement>(`/advertisements/${id}`, { method: "GET" });
}

export async function patchAdvertisement(
  id: string,
  input: AdvertisementPatchInput,
) {
  return apiFetch<Advertisement>(`/advertisements/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteAdvertisement(id: string) {
  return apiFetch<void>(`/advertisements/${id}`, { method: "DELETE" });
}

export async function getAdvertisementPreview(id: string) {
  return apiFetchBinary(`/advertisements/${id}/preview`, { method: "GET" });
}

export async function getAdvertisementContent(id: string) {
  return apiFetchBinary(`/advertisements/${id}/content`, { method: "GET" });
}

export async function replaceAdvertisementContent(id: string, file: FormData) {
  return apiFetch<Advertisement>(`/advertisements/${id}/content`, {
    method: "PUT",
    body: file,
  });
}
