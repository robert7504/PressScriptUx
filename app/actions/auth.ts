"use server";

import { redirect } from "next/navigation";
import { AuthApiError, loginRequest } from "@/lib/auth/api";
import { createSession, deleteSession } from "@/lib/auth/session";
import type { LoginFormState } from "@/lib/auth/types";

function validateLoginFields(email: string, password: string) {
  const fieldErrors: NonNullable<LoginFormState["fieldErrors"]> = {};

  if (!email) {
    fieldErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address";
  }

  if (!password) {
    fieldErrors.password = "Password is required";
  }

  return fieldErrors;
}

export async function login(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors = validateLoginFields(email, password);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const nextRaw = String(formData.get("next") ?? "/");
  const nextPath = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

  try {
    const result = await loginRequest(email, password);
    await createSession(result.accessToken, result.user, {
      expiresInSeconds: result.expiresIn || 60 * 60,
    });
  } catch (error) {
    if (error instanceof AuthApiError) {
      return { error: error.message };
    }

    return { error: "Unable to reach the authentication service" };
  }

  redirect(nextPath);
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
