import "server-only";

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, USER_COOKIE } from "./constants";
import type { AuthUser } from "./types";

export { ACCESS_TOKEN_COOKIE, USER_COOKIE };

type SessionCookieOptions = {
  expiresInSeconds: number;
};

export async function createSession(
  accessToken: string,
  user: AuthUser,
  { expiresInSeconds }: SessionCookieOptions,
) {
  const cookieStore = await cookies();
  const maxAge = Math.max(expiresInSeconds, 60);
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, common);
  cookieStore.set(USER_COOKIE, JSON.stringify(user), common);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(USER_COOKIE);
}

export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  return Boolean(await getAccessToken());
}
