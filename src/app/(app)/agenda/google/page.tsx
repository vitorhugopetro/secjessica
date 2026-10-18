"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GoogleCalendarPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const shown = React.useRef(false);

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const connected = params.get("connected") === "1";
  const error = params.get("error") || "";

  useEffect(() => {
    if ((connected || error) && !shown.current) {
      shown.current = true;
      window.history.replaceState({}, document.title, window.location.pathname);
      if (connected) {
        toast({ title: "Google Agenda conectado", description: "Sua agenda foi sincronizada com sucesso." });
      }
    }
  }, [connected, error, toast]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  const configured = Boolean(clientId && redirectUri);

  if (!configured) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secjessica-900">Google Agenda</h1>
        <Card>
          <CardContent>
            <h2 className="font-semibold mb-2">Configuração necessária</h2>
            <p className="text-sm text-muted-foreground">
              O Google Agenda ainda não está configurado. Defina as variáveis de ambiente
              <code className="font-mono text-xs bg-secondary p-1 rounded">GOOGLE_CLIENT_ID</code>,
              <code className="font-mono text-xs bg-secondary p-1 rounded">GOOGLE_CLIENT_SECRET</code> e
              <code className="font-mono text-xs bg-secondary p-1 rounded">GOOGLE_REDIRECT_URI</code> no Supabase/Vercel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Google Agenda</h1>
          <p className="text-muted-foreground">
            Sincronize os compromissos da empresa{" "}
            <span className="font-medium">{currentCompany?.name}</span>
            com o Google Agenda.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conexão com o Google Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          {!connected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ao conectar, você poderá criar compromissos no SecJessica e eles aparecerão automaticamente no Google Agenda (e vice-versa).
              </p>
                <Button
                  onClick={() => {
                    const url = `/api/google-calendar/auth?company_id=${currentCompany?.id ?? "default"}`;
                    router.push(url);
                  }}
                className="w-full flex items-center justify-center gap-2 bg-secjessica-600 hover:bg-secjessica-500"
              >
                <Mail className="h-4 w-4" /> Conectar conta do Google
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-lg p-4 border border-green-100">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <div className="font-semibold">Google Agenda conectado</div>
                <div className="text-sm text-green-600">Sincronização ativa para {currentCompany?.name}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
