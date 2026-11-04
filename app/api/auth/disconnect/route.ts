import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/google-oauth";

export async function POST() {
  try {
    await disconnectGmail();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
