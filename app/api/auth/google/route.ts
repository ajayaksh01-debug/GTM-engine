import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-oauth";

export async function GET() {
  try {
    return NextResponse.redirect(getGoogleAuthUrl());
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
