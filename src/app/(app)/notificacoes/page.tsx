/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Clock } from "lucide-react";
import { listNotifications, markNotificationRead } from "@/features/notifications/actions";
import { useToast } from "@/components/ui/use-toast";

export default function NotificacoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  async function loadNotifications() {
    if (!user?.id) return;
    setLoading(true);
    const res = await listNotifications(user.id);
    if (!res.error) setNotifications(res.data);
    setLoading(false);
  }

  async function handleRead(id: string) {
    await markNotificationRead(id);
    await loadNotifications();
    toast({ title: "Notificação lida" });
  }

  if (loading) return <div className="h-64 flex items-center justify-center">Carregando…</div>;
  if (!user?.id) return <div className="p-4">Faça login para ver as notificações.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Notificações</h1>
          <p className="text-muted-foreground">Central de avisos e pendências da sua conta.</p>
        </div>
      </div>

      <div className="rounded-xl border border-input bg-background shadow-sm">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input bg-secondary text-left text-xs font-semibold text-muted-foreground">
                <th className="p-4">Título</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Data</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className={`border-b border-input/50 hover:bg-secondary/50 ${!n.read ? "bg-secjessica-50" : ""}`}>
                  <td className="p-4 font-medium">{n.title}</td>
                  <td className="p-4 text-muted-foreground">{n.kind ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-4 text-right">
                    {!n.read ? (
                      <Button size="sm" onClick={() => handleRead(n.id)}>Marcar como lida</Button>
                    ) : (
                      <span className="text-xs text-green-600">Lida</span>
                    )}
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Sem notificações.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lembretes de compromisso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-secjessica-600" />
              <div>
                <div className="font-medium">Receba avisos de compromissos próximos</div>
                <div className="text-xs text-muted-foreground">Configurado automaticamente por empresa</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Falhas de sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-secjessica-600" />
              <div>
                <div className="font-medium">Notifique falhas do Google Agenda</div>
                <div className="text-xs text-muted-foreground">Tokens expirados e erros de API</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tarefas vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-secjessica-600" />
              <div>
                <div className="font-medium">Acompanhe prazos administrativos</div>
                <div className="text-xs text-muted-foreground">Veja a página de Tarefas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
