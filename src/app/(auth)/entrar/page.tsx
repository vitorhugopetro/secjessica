"use client";

import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secjessica-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre na sua conta SecJessica para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="flex items-center gap-2 pl-3 pr-2 border border-input rounded-md bg-background focus-within:border-secjessica-600 focus-within:ring-1 focus-within:ring-secjessica-600">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input {...form.register("email")} type="email" placeholder="seu@email.com" className="bg-transparent" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="flex items-center gap-2 pl-3 pr-2 border border-input rounded-md bg-background focus-within:border-secjessica-600 focus-within:ring-1 focus-within:ring-secjessica-600">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Input {...form.register("password")} type="password" placeholder="••••••••" className="bg-transparent" />
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</div>
            )}
            <Button type="submit" className="w-full bg-secjessica-600 hover:bg-secjessica-500" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 justify-center text-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="font-semibold text-secjessica-600 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
