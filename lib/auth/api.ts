import "server-only";

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
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  let data: Partial<LoginResponse> & { error?: string; message?: string } = {};
  try {
    data = (await response.json()) as typeof data;
  } catch {
    // Backend may return empty body on some errors.
  }

  if (!response.ok) {
    throw new AuthApiError(
      data.error || data.message || "Invalid email or password",
      response.status,
    );
  }

  if (!data.accessToken || !data.user) {
    throw new AuthApiError("Unexpected login response from API", 500);
  }

  return data as LoginResponse;
}
