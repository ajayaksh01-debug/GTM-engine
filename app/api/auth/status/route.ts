import { NextResponse } from "next/server";
import { isGmailConnected } from "@/lib/google-oauth";

export async function GET() {
  try {
    const connected = await isGmailConnected();
    return NextResponse.json({ connected });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
