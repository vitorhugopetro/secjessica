import { createServerClient } from "@/lib/supabase/server";
import { auth, calendar } from "@googleapis/calendar";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state") || "default";
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/agenda/google?error=${encodeURIComponent(error)}`, requestUrl.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/agenda/google", requestUrl.origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Google OAuth não configurado no servidor." }, { status: 500 });
  }

  try {
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Busca calendários do usuário para determinar o calendar_id principal
    const calInstance = calendar({ version: "v3", auth: oauth2Client });
    const calList = await calInstance.calendarList.list();
    const primary = calList.data.items?.find((c: any) => c.primary) ?? calList.data.items?.[0];
    const calendarId = primary?.id ?? "primary";

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determina company_id: do state ou da empresa do usuário
    let companyId = state;
    if (user && companyId === "default") {
      const { data: members } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1);
      if (members && members[0]) companyId = members[0].company_id;
    }

    if (user && companyId && companyId !== "default") {
      await supabase.from("google_calendar_connections").upsert(
        {
          company_id: companyId,
          user_id: user.id,
          calendar_id: calendarId,
          access_token: tokens.access_token ?? null,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id" }
      );
    }

    return NextResponse.redirect(new URL(`/agenda/google?connected=1`, requestUrl.origin));
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/agenda/google?error=${encodeURIComponent(err?.message || "oauth_failed")}`, requestUrl.origin)
    );
  }
}
