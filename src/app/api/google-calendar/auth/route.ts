import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id") || "default";

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_REDIRECT_URI." },
      { status: 500 }
    );
  }

  const scope = "https://www.googleapis.com/auth/calendar";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state: companyId,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
