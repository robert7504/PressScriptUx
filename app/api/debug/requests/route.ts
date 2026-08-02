import { NextResponse } from "next/server";
import {
  clearApiDebugEvents,
  getApiDebugEvents,
  isApiDebugEnabled,
} from "@/lib/api/debug";

export async function GET() {
  if (!isApiDebugEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ events: getApiDebugEvents() });
}

export async function DELETE() {
  if (!isApiDebugEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  clearApiDebugEvents();
  return NextResponse.json({ ok: true });
}
