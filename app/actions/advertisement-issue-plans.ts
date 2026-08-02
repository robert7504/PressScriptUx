"use server";

import { revalidatePath } from "next/cache";
import {
  createAdvertisementIssuePlan,
  deleteAdvertisementIssuePlan,
} from "@/lib/advertisement-issue-plans/api";
import type { AdvertisementIssuePlanActionState } from "@/lib/advertisement-issue-plans/types";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";

async function ensureAuthenticated(): Promise<AdvertisementIssuePlanActionState | null> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Sesja wygasła. Zaloguj się ponownie." };
  }
  return null;
}

function revalidatePlanPaths() {
  revalidatePath("/advertisements");
}

export async function createAdvertisementIssuePlanAction(
  advertisementId: string,
  issueId: string,
): Promise<AdvertisementIssuePlanActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const adId = advertisementId.trim();
  const issId = issueId.trim();
  if (!adId || !issId) {
    return { error: "Wybierz reklamę i wydanie." };
  }

  try {
    await createAdvertisementIssuePlan({
      advertisementId: adId,
      issueId: issId,
    });
    revalidatePlanPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function deleteAdvertisementIssuePlanAction(
  planId: string,
): Promise<AdvertisementIssuePlanActionState> {
  const authError = await ensureAuthenticated();
  if (authError) return authError;

  const id = planId.trim();
  if (!id) {
    return { error: "Brak identyfikatora planu." };
  }

  try {
    await deleteAdvertisementIssuePlan(id);
    revalidatePlanPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }
}
