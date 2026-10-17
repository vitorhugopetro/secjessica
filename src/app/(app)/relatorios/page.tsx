"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users, Calendar, ShieldCheck, Clock, Mail as MailIcon } from "lucide-react";
import { listReports, exportAppointmentsCSV } from "@/features/reports/actions";
import { useToast } from "@/components/ui/use-toast";

export default function RelatoriosPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [currentCompany?.id]);

  async function loadReport() {
    if (!currentCompany?.id) return;
    setLoading(true);
    const res = await listReports(currentCompany.id);
    if (!res.error) setReport(res.data);
    setLoading(false);
  }

  async function handleExport() {
    if (!currentCompany?.id) return;
    const res = await exportAppointmentsCSV(currentCompany.id);
    if (!res.error) {
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `agendamentos-${currentCompany.slug}-${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Exportação concluída", description: "CSV de agendamentos baixado." });
    } else {
      toast({ title: "Erro", description: typeof res.error === "string" ? res.error : "Falha na exportação", variant: "destructive" });
    }
  }

  if (loading) return <div className="h-64 flex items-center justify-center">Carregando…</div>;
  if (!currentCompany) return <div className="p-4">Selecione uma empresa primeiro.</div>;

  const s = report?.summary ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Relatórios</h1>
          <p className="text-muted-foreground">Indicadores operacionais da empresa {currentCompany.name}.</p>
        </div>
        <Button onClick={handleExport}>
          <MailIcon className="h-4 w-4 mr-2" /> Exportar agendamentos (CSV)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de compromissos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{s.totalAppointments ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{s.confirmedAppointments ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{s.cancelledAppointments ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{s.totalContacts ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{s.totalTasks ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{s.completedTasks ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{s.overdueTasks ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-secjessica-600" />
              <div>
                <div className="font-medium">{currentCompany.name}</div>
                <div className="text-xs text-muted-foreground">{currentCompany.slug}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-input bg-background shadow-sm p-6">
        <h3 className="font-semibold mb-4">Detalhes dos compromissos</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input bg-secondary text-left text-xs font-semibold text-muted-foreground">
                <th className="p-4">Título</th>
                <th className="p-4">Início</th>
                <th className="p-4">Término</th>
                <th className="p-4">Status</th>
                <th className="p-4">Cliente</th>
              </tr>
            </thead>
            <tbody>
              {(report?.appointments ?? []).map((a: any) => (
                <tr key={a.id} className="border-b border-input/50">
                  <td className="p-4 font-medium">{a.title}</td>
                  <td className="p-4 text-muted-foreground">{new Date(a.starts_at).toLocaleString("pt-BR")}</td>
                  <td className="p-4 text-muted-foreground">{new Date(a.ends_at).toLocaleString("pt-BR")}</td>
                  <td className="p-4 text-muted-foreground">{a.status}</td>
                  <td className="p-4 text-muted-foreground">{a.client?.name ?? "—"}</td>
                </tr>
              ))}
              {(report?.appointments ?? []).length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sem compromissos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Building({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
