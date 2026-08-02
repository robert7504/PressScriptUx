import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";
import { getMagazineImageContent } from "@/lib/magazine-images/api";

type RouteContext = {
  params: Promise<{ magazineId: string; imageId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { magazineId, imageId } = await context.params;

  try {
    const { body, contentType } = await getMagazineImageContent(
      magazineId,
      imageId,
    );
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Nie udało się pobrać zdjęcia." },
      { status: 500 },
    );
  }
}
