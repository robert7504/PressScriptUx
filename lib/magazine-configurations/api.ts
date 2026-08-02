import "server-only";

import { apiFetch } from "../api/client";
import type {
  MagazineConfiguration,
  MagazineConfigurationCreateInput,
  MagazineConfigurationUpdateInput,
  MagazineConfigurationType,
} from "./types";

export type ListMagazineConfigurationsParams = {
  active?: boolean;
  type?: MagazineConfigurationType;
  magazineId?: string;
};

export async function listMagazineConfigurations(
  params: ListMagazineConfigurationsParams = {},
) {
  return apiFetch<MagazineConfiguration[]>("/magazine-configurations", {
    method: "GET",
    searchParams: {
      active: params.active,
      type: params.type,
      magazineId: params.magazineId,
    },
  });
}

export async function getMagazineConfiguration(id: string) {
  return apiFetch<MagazineConfiguration>(`/magazine-configurations/${id}`, {
    method: "GET",
  });
}

export async function createMagazineConfiguration(
  input: MagazineConfigurationCreateInput,
) {
  return apiFetch<MagazineConfiguration>("/magazine-configurations", {
    method: "POST",
    body: input,
  });
}

export async function updateMagazineConfiguration(
  id: string,
  input: MagazineConfigurationUpdateInput,
) {
  return apiFetch<MagazineConfiguration>(`/magazine-configurations/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteMagazineConfiguration(id: string) {
  return apiFetch<void>(`/magazine-configurations/${id}`, {
    method: "DELETE",
  });
}
