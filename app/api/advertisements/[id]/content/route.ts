import { NextResponse } from "next/server";
import { getAdvertisementContent } from "@/lib/advertisements/api";
import { ApiError } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const { body, contentType } = await getAdvertisementContent(id);
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
      { error: "Nie udało się pobrać pliku reklamy." },
      { status: 500 },
    );
  }
}
