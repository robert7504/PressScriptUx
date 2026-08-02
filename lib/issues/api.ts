import "server-only";

import { apiFetch } from "../api/client";
import type { Issue, IssueCreateInput, IssueUpdateInput } from "./types";

export type ListIssuesParams = {
  active?: boolean;
  magazineId?: string;
  year?: number;
};

export async function listIssues(params: ListIssuesParams = {}) {
  return apiFetch<Issue[]>("/issues", {
    method: "GET",
    searchParams: {
      active: params.active,
      magazineId: params.magazineId,
      year: params.year,
    },
  });
}

export async function getIssue(id: string) {
  return apiFetch<Issue>(`/issues/${id}`, { method: "GET" });
}

export async function createIssue(input: IssueCreateInput) {
  return apiFetch<Issue>("/issues", {
    method: "POST",
    body: input,
  });
}

export async function updateIssue(id: string, input: IssueUpdateInput) {
  return apiFetch<Issue>(`/issues/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteIssue(id: string) {
  return apiFetch<void>(`/issues/${id}`, { method: "DELETE" });
}
