import "server-only";

import { logApiRequest } from "../api/debug";
import { getApiBaseUrl } from "../config";
import type { LoginResponse } from "./types";

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

export async function loginRequest(email: string, password: string) {
  const method = "POST";
  const url = `${getApiBaseUrl()}/auth/login`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const serializedBody = JSON.stringify({ email, password });
  const startedAt = Date.now();

  const log = (extra: { status?: number; error?: string }) => {
    logApiRequest({
      method,
      url,
      headers,
      body: serializedBody,
      durationMs: Date.now() - startedAt,
      ...extra,
    });
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: serializedBody,
      cache: "no-store",
    });

    let data: Partial<LoginResponse> & { error?: string; message?: string } = {};
    try {
      data = (await response.json()) as typeof data;
    } catch {
      // Backend may return empty body on some errors.
    }

    if (!response.ok) {
      const message = data.error || data.message || "Invalid email or password";
      log({ status: response.status, error: message });
      throw new AuthApiError(message, response.status);
    }

    if (!data.accessToken || !data.user) {
      const message = "Unexpected login response from API";
      log({ status: 500, error: message });
      throw new AuthApiError(message, 500);
    }

    log({ status: response.status });
    return data as LoginResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Network request failed";
    log({ error: message });
    throw error;
  }
}
