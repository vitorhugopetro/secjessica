import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    const errorMsg = errorDescription || error;
    return NextResponse.redirect(
      new URL(`/entrar?error=${encodeURIComponent(errorMsg)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await createServerClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[OAuth Callback Error]", exchangeError);
      return NextResponse.redirect(
        new URL(`/entrar?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    if (data?.session?.user) {
      const user = data.session.user;
      const metadata = user.user_metadata || {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "Colaborador";
      const avatarUrl = metadata.avatar_url || metadata.picture || null;

      // 1. Atualiza ou cria perfil com dados da conta Google
      try {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.warn("[OAuth Callback] Profile sync notice:", profileErr);
      }

      // 2. Se houver convites pendentes para o e-mail do colaborador, aceita automaticamente
      if (user.email) {
        try {
          const { data: invitations } = await supabase
            .from("company_invitations")
            .select("*")
            .eq("email", user.email.toLowerCase())
            .is("accepted_at", null);

          if (invitations && invitations.length > 0) {
            for (const invite of invitations) {
              await supabase.from("company_members").upsert(
                {
                  company_id: invite.company_id,
                  user_id: user.id,
                  role: invite.role || "secretary",
                },
                { onConflict: "company_id,user_id" }
              );

              await supabase
                .from("company_invitations")
                .update({ accepted_at: new Date().toISOString() })
                .eq("id", invite.id);
            }
          }
        } catch (inviteErr) {
          console.warn("[OAuth Callback] Invite sync notice:", inviteErr);
        }
      }

      // 3. Garante que o usuário possua ao menos um espaço / empresa vinculado
      try {
        const { data: memberships } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", user.id)
          .limit(1);

        if (!memberships || memberships.length === 0) {
          const baseSlug = (user.email?.split("@")[0] || "workspace")
            .replace(/[^a-z0-9]/gi, "")
            .toLowerCase();
          const uniqueSlug = `${baseSlug}-${user.id.slice(0, 6)}`;

          const { data: newCompany } = await supabase
            .from("companies")
            .insert({
              name: `Espaço de ${fullName}`,
              slug: uniqueSlug,
              email: user.email,
              owner_id: user.id,
              plan: "pro",
              status: "active",
            })
            .select()
            .single();

          if (newCompany) {
            await supabase.from("company_members").insert({
              company_id: newCompany.id,
              user_id: user.id,
              role: "admin",
            });
          }
        }
      } catch (companyErr) {
        console.warn("[OAuth Callback] Company sync notice:", companyErr);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
