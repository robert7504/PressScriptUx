import "server-only";

import { apiFetch } from "../api/client";
import type {
  Publisher,
  PublisherCreateInput,
  PublisherUpdateInput,
} from "./types";

export type ListPublishersParams = {
  active?: boolean;
};

export async function listPublishers(params: ListPublishersParams = {}) {
  return apiFetch<Publisher[]>("/publishers", {
    method: "GET",
    searchParams: {
      active: params.active,
    },
  });
}

export async function getPublisher(id: string) {
  return apiFetch<Publisher>(`/publishers/${id}`, { method: "GET" });
}

export async function createPublisher(input: PublisherCreateInput) {
  return apiFetch<Publisher>("/publishers", {
    method: "POST",
    body: input,
  });
}

export async function updatePublisher(id: string, input: PublisherUpdateInput) {
  return apiFetch<Publisher>(`/publishers/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deletePublisher(id: string) {
  return apiFetch<void>(`/publishers/${id}`, { method: "DELETE" });
}
