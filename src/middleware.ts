import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isAuthRoute = url.pathname.startsWith("/entrar") || url.pathname.startsWith("/cadastro");
  const isAppRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/empresas") ||
    url.pathname.startsWith("/clientes") ||
    url.pathname.startsWith("/contatos") ||
    url.pathname.startsWith("/agenda") ||
    url.pathname.startsWith("/usuarios") ||
    url.pathname.startsWith("/configuracoes") ||
    url.pathname.startsWith("/tarefas") ||
    url.pathname.startsWith("/comunicacao") ||
    url.pathname.startsWith("/relatorios") ||
    url.pathname.startsWith("/notificacoes") ||
    url.pathname.startsWith("/onboarding");

  // Rotas de app exigem autenticação
  if (isAppRoute && !user && !supabaseUrl.includes("placeholder")) {
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  // Rotas de auth redirecionam autenticados para o painel
  if (isAuthRoute && user) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|.*\\..*$).*)"],
};
