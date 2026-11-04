import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const appUrl = process.env.APP_URL ?? req.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?gmail=error&message=missing_code`);
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(`${appUrl}/?gmail=connected`);
  } catch (err) {
    return NextResponse.redirect(
      `${appUrl}/?gmail=error&message=${encodeURIComponent((err as Error).message)}`
    );
  }
}
