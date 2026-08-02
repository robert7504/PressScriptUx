import "server-only";

import { getApiBaseUrl } from "../config";
import { getAccessToken } from "../auth/session";
import { logApiRequest } from "./debug";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  searchParams?: Record<
    string,
    string | number | boolean | undefined | null
  >;
};

function buildUrl(
  path: string,
  searchParams?: ApiFetchOptions["searchParams"],
) {
  const url = new URL(
    path.startsWith("/") ? path.slice(1) : path,
    `${getApiBaseUrl().replace(/\/$/, "")}/`,
  );

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  { body, searchParams, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const token = await getAccessToken();
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method ?? (body !== undefined ? "POST" : "GET")).toUpperCase();
  const url = buildUrl(path, searchParams);
  const serializedBody =
    body === undefined ? undefined : JSON.stringify(body);
  const startedAt = Date.now();

  const log = (extra: { status?: number; error?: string }) => {
    logApiRequest({
      method,
      url,
      headers: requestHeaders,
      body: serializedBody,
      durationMs: Date.now() - startedAt,
      ...extra,
    });
  };

  try {
    const response = await fetch(url, {
      ...init,
      headers: requestHeaders,
      body: serializedBody,
      cache: "no-store",
    });

    if (response.status === 204) {
      log({ status: response.status });
      return undefined as T;
    }

    let data: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorBody = data as { error?: string; message?: string } | null;
      const message =
        errorBody?.error ||
        errorBody?.message ||
        `Request failed (${response.status})`;
      log({ status: response.status, error: message });
      throw new ApiError(message, response.status);
    }

    log({ status: response.status });
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Network request failed";
    log({ error: message });
    throw error;
  }
}
