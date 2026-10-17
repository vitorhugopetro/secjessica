import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/entrar?error=${encodeURIComponent(error)}`, requestUrl.origin));
  }

  if (code) {
    const supabase = await createServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
