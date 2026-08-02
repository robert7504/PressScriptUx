import "server-only";

import { apiFetch } from "../api/client";
import type {
  AdvertisementIssuePlan,
  AdvertisementIssuePlanCreateInput,
} from "./types";

export type ListAdvertisementIssuePlansParams = {
  active?: boolean;
  advertisementId?: string;
  issueId?: string;
};

export async function listAdvertisementIssuePlans(
  params: ListAdvertisementIssuePlansParams = {},
) {
  return apiFetch<AdvertisementIssuePlan[]>("/advertisement-issue-plans", {
    method: "GET",
    searchParams: {
      active: params.active,
      advertisementId: params.advertisementId,
      issueId: params.issueId,
    },
  });
}

export async function createAdvertisementIssuePlan(
  input: AdvertisementIssuePlanCreateInput,
) {
  return apiFetch<AdvertisementIssuePlan>("/advertisement-issue-plans", {
    method: "POST",
    body: input,
  });
}

export async function deleteAdvertisementIssuePlan(id: string) {
  return apiFetch<void>(`/advertisement-issue-plans/${id}`, {
    method: "DELETE",
  });
}
