"use client";

import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

function SignInForm() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    setLoading(true);
    setError("");
    const res = await signIn(data.email, data.password);
    setLoading(false);
    if (res.error) {
      setError(res.error?.message ?? "Erro ao entrar");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    const res = await signInWithGoogle();
    if (res.error) {
      setError(res.error?.message ?? "Não foi possível conectar com o Google.");
      setGoogleLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-secjessica-950">Bem-vindo de volta</CardTitle>
        <CardDescription>
          Entre com sua conta Google pessoal ou digite suas credenciais para acessar o Sec Jessica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200" role="alert">
            {error}
          </div>
        )}

        {/* Botão Oficial Conectar com Google */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full h-11 flex items-center justify-center gap-3 border-slate-300 hover:bg-slate-50 font-medium text-slate-700 shadow-sm transition-all"
        >
          {googleLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-secjessica-600" />
              <span>Conectando ao Google...</span>
            </>
          ) : (
            <>
              <GoogleIcon className="h-5 w-5" />
              <span>Continuar com o Google</span>
            </>
          )}
        </Button>

        {/* Divisor */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-slate-200"></div>
          <span className="absolute bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            ou com e-mail
          </span>
        </div>

        {/* Formulário com e-mail e senha */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="flex items-center gap-2 pl-3 pr-2 border border-input rounded-md bg-background focus-within:border-secjessica-600 focus-within:ring-1 focus-within:ring-secjessica-600">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                {...form.register("email")}
                type="email"
                placeholder="seu@email.com"
                className="bg-transparent border-0 focus-visible:ring-0 shadow-none px-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="flex items-center gap-2 pl-3 pr-2 border border-input rounded-md bg-background focus-within:border-secjessica-600 focus-within:ring-1 focus-within:ring-secjessica-600">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="bg-transparent border-0 focus-visible:ring-0 shadow-none px-0"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-secjessica-600 hover:bg-secjessica-500 font-semibold"
            disabled={loading || googleLoading}
          >
            {loading ? "Entrando..." : "Entrar com e-mail"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 justify-center text-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="font-semibold text-secjessica-600 hover:underline">
            Cadastre-se gratuitamente
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secjessica-50 px-4 py-8">
      <Suspense
        fallback={
          <Card className="w-full max-w-md p-8 text-center text-muted-foreground">
            Carregando tela de acesso...
          </Card>
        }
      >
        <SignInForm />
      </Suspense>
    </div>
  );
}
