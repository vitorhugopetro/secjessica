import { NextResponse, type NextRequest } from "next/server";
import { firebaseClient } from "@/lib/firebase/client";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

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

  // Verifica se o usuário está autenticado via Firebase (verifica token no cookie)
  const firebaseToken = request.cookies.get("secjessica:firebase_auth")?.value;
  let isAuthenticated = false;

  if (firebaseToken) {
    try {
      const data = JSON.parse(firebaseToken);
      if (data && data.idToken && data.uid) {
        isAuthenticated = true;
      }
    } catch {
      // Token inválido, trata como não autenticado
    }
  }

  // Rotas de app exigem autenticação
  if (isAppRoute && !isAuthenticated) {
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  // Rotas de auth redirecionam autenticados para o painel
  if (isAuthRoute && isAuthenticated) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|.*\\..*$).*)"],
};
