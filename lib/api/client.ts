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

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

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

  const multipart = isFormDataBody(body);
  if (body !== undefined && !multipart) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method ?? (body !== undefined ? "POST" : "GET")).toUpperCase();
  const url = buildUrl(path, searchParams);
  const requestBody =
    body === undefined
      ? undefined
      : multipart
        ? body
        : JSON.stringify(body);
  const logBody = multipart
    ? "(multipart form-data)"
    : (requestBody as string | undefined);
  const startedAt = Date.now();

  const log = (extra: {
    status?: number;
    error?: string;
    responseBody?: string;
  }) => {
    logApiRequest({
      method,
      url,
      headers: requestHeaders,
      body: logBody,
      durationMs: Date.now() - startedAt,
      ...extra,
    });
  };

  try {
    const response = await fetch(url, {
      ...init,
      headers: requestHeaders,
      body: requestBody,
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
      log({
        status: response.status,
        error: message,
        responseBody: text || undefined,
      });
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

export async function apiFetchBinary(
  path: string,
  { searchParams, headers, ...init }: Omit<ApiFetchOptions, "body"> = {},
): Promise<{ body: ArrayBuffer; contentType: string | null }> {
  const token = await getAccessToken();
  const requestHeaders = new Headers(headers);
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method ?? "GET").toUpperCase();
  const url = buildUrl(path, searchParams);
  const startedAt = Date.now();

  const log = (extra: { status?: number; error?: string }) => {
    logApiRequest({
      method,
      url,
      headers: requestHeaders,
      durationMs: Date.now() - startedAt,
      ...extra,
    });
  };

  try {
    const response = await fetch(url, {
      ...init,
      headers: requestHeaders,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `Request failed (${response.status})`;
      if (text) {
        try {
          const data = JSON.parse(text) as {
            error?: string;
            message?: string;
          };
          message = data.error || data.message || message;
        } catch {
          message = text;
        }
      }
      log({ status: response.status, error: message });
      throw new ApiError(message, response.status);
    }

    log({ status: response.status });
    return {
      body: await response.arrayBuffer(),
      contentType: response.headers.get("Content-Type"),
    };
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
