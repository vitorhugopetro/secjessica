"use client";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mail, Clock, Plus, CheckCircle2, RefreshCw, Building2 } from "lucide-react";
import Link from "next/link";
import { listReports } from "@/features/reports/actions";
import { InspirationalBanner } from "@/components/inspirational-banner";
import { firebaseClient } from "@/lib/firebase/client";

export default function DashboardPage() {
  const { currentCompany, profile, companies } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    clients: 0,
    contacts: 0,
    appointments: 0,
    today: 0,
    tasks: 0,
  });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const storedFb = firebaseClient.getStoredAuth();
      const token = storedFb?.idToken;

      const [appointments, contacts, tasks] = await Promise.all([
        firebaseClient.listDocs("appointments", token).catch(() => []),
        firebaseClient.listDocs("contacts", token).catch(() => []),
        firebaseClient.listDocs("tasks", token).catch(() => []),
      ]);

      const companyAppointments = appointments.filter((a: any) => !a.company_id || a.company_id === currentCompany.id);
      const companyContacts = contacts.filter((c: any) => !c.company_id || c.company_id === currentCompany.id);
      const companyTasks = tasks.filter((t: any) => !t.company_id || t.company_id === currentCompany.id);

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayCount = companyAppointments.filter((a: any) =>
        a.starts_at?.startsWith(todayStr)
      ).length;

      setStats({
        clients: companyContacts.length,
        contacts: companyContacts.length,
        appointments: companyAppointments.length,
        today: todayCount,
        tasks: companyTasks.length,
      });

      // Próximos compromissos
      const sorted = [...companyAppointments]
        .filter((a: any) => new Date(a.starts_at) >= new Date(Date.now() - 3600000))
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .slice(0, 5);
      setUpcoming(sorted);

      // Contatos recentes
      setRecentContacts(companyContacts.slice(0, 5));
    } catch (err) {
      console.warn("Aviso ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const statCards = [
    { label: "Total de Compromissos", value: stats.appointments, icon: Calendar, color: "text-secjessica-700", bg: "bg-secjessica-50" },
    { label: "Compromissos Hoje", value: stats.today, icon: Clock, color: "text-secjessica-900", bg: "bg-secjessica-100/60" },
    { label: "Contatos e Clientes", value: stats.contacts, icon: Users, color: "text-secjessica-600", bg: "bg-secjessica-50" },
    { label: "Tarefas Pendentes", value: stats.tasks, icon: CheckCircle2, color: "text-secjessica-800", bg: "bg-secjessica-50" },
  ];

  if (!currentCompany && companies.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-10 text-center bg-card rounded-2xl border border-input shadow-sm max-w-2xl mx-auto mt-6">
          <Building2 className="h-12 w-12 text-secjessica-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secjessica-900">Bem-vinda ao SecJessica!</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Para começar a gerenciar sua rotina de secretária remota, cadastre sua primeira empresa contratante.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button asChild className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
              <Link href="/onboarding">
                <Plus className="h-4 w-4 mr-1" /> Cadastrar Primeira Empresa
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Painel Operacional</h1>
          <p className="text-muted-foreground">
            Olá, <span className="font-semibold text-foreground">{profile?.full_name ?? "Secretária"}</span>. Empresa ativa:{" "}
            <span className="font-semibold text-secjessica-700">{currentCompany?.name ?? "Selecione uma empresa"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => {
              void loadDashboardData();
              toast({ title: "Atualizado", description: "Dados sincronizados com o servidor." });
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sincronizar
          </Button>
          <Button asChild className="bg-secjessica-600 hover:bg-secjessica-500 text-white" size="sm">
            <Link href="/agenda">
              <Plus className="h-4 w-4 mr-1" /> Novo Agendamento
            </Link>
          </Button>
        </div>
      </div>

      {/* Palavra Inspiradora & Versículo Bíblico do Dia */}
      <InspirationalBanner />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-input/70 bg-card shadow-sm hover:shadow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {s.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secjessica-900">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2 border-input/70 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Próximos Compromissos da Agenda</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-secjessica-700">
              <Link href="/agenda">Ver agenda completa &rarr;</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((item) => {
                  const dateStr = new Date(item.starts_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                  const timeStr = new Date(item.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-input/50 bg-secondary/30 hover:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-secjessica-100 text-secjessica-800 font-bold text-xs">
                          <span>{dateStr}</span>
                          <span className="font-normal text-[10px] text-secjessica-700">{timeStr}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.client?.name ? `Cliente: ${item.client.name}` : "Sem cliente vinculado"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.status === "confirmed" ? "Confirmado" : "Agendado"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum compromisso agendado para os próximos dias.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-1 border-input/70 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Contatos Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-secjessica-700">
              <Link href="/contatos">Ver todos &rarr;</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentContacts.length > 0 ? (
              <div className="space-y-3">
                {recentContacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-input/50 bg-secondary/30"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-secjessica-100 text-secjessica-800 font-semibold text-xs">
                      {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.phone || c.email || "Sem dados"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nenhum contato cadastrado ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
