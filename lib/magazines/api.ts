import "server-only";

import { apiFetch } from "../api/client";
import type {
  Magazine,
  MagazineCreateInput,
  MagazineUpdateInput,
} from "./types";

export type ListMagazinesParams = {
  active?: boolean;
  publisherId?: string;
};

export async function listMagazines(params: ListMagazinesParams = {}) {
  return apiFetch<Magazine[]>("/magazines", {
    method: "GET",
    searchParams: {
      active: params.active,
      publisherId: params.publisherId,
    },
  });
}

export async function getMagazine(id: string) {
  return apiFetch<Magazine>(`/magazines/${id}`, { method: "GET" });
}

export async function createMagazine(input: MagazineCreateInput) {
  return apiFetch<Magazine>("/magazines", {
    method: "POST",
    body: input,
  });
}

export async function updateMagazine(id: string, input: MagazineUpdateInput) {
  return apiFetch<Magazine>(`/magazines/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteMagazine(id: string) {
  return apiFetch<void>(`/magazines/${id}`, { method: "DELETE" });
}
