/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Trash2, MessageSquare, Send, ExternalLink, Clock, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createAppointment, listAppointments, deleteAppointment } from "@/features/scheduling/actions";
import { useToast } from "@/components/ui/use-toast";
import { listClientsByCompany } from "@/app/(app)/clientes/actions";
import { listContacts } from "@/features/contacts/actions";
import { sendAppointmentWhatsAppNotification, sendWhatsAppMessage } from "@/features/whatsapp/actions";

const appointmentSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  client_id: z.string().optional(),
  contact_id: z.string().optional(),
  starts_at: z.string().min(1, "Data e horário de início são obrigatórios"),
  ends_at: z.string().min(1, "Data e horário de término são obrigatórios"),
  status: z.string(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function AgendaPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  // WhatsApp Dispatch State
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [waKind, setWaKind] = useState<"confirmation" | "reminder" | "pix">("confirmation");
  const [waPreview, setWaPreview] = useState("");
  const [waSending, setWaSending] = useState(false);

  function openWhatsAppDispatch(app: any, kind: "confirmation" | "reminder" | "pix" = "confirmation") {
    setSelectedApp(app);
    setWaKind(kind);

    const clientName = app.client?.name || "Cliente";
    const companyName = currentCompany?.name || "Nossa Clínica";
    const startDate = new Date(app.starts_at);
    const formattedDate = startDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let preview = "";
    if (kind === "confirmation") {
      preview = `Olá, *${clientName}*! Tudo bem?\n\nConfirmamos seu agendamento para o atendimento *"${app.title}"* na *${companyName}*:\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\nPor favor, responda com *1 para CONFIRMAR* ou *2 para REAGENDAR*.\n\nAtenciosamente,\n*Equipe SecJessica & ${companyName}*`;
    } else if (kind === "reminder") {
      preview = `⏰ *Lembrete de Compromisso*\n\nOlá, *${clientName}*! Lembramos do seu agendamento:\n\n📌 *Assunto:* ${app.title}\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\nEstamos ansiosos pelo seu atendimento!`;
    } else if (kind === "pix") {
      preview = `💳 *Orientações de Pagamento / Chave Pix*\n\nOlá, *${clientName}*! Seguem os dados para confirmação da sua reserva para ${formattedDate}:\n\n🔑 *Chave Pix:* ${currentCompany?.phone || "contato@secjessica.com.br"}\nBeneficiário: *${companyName}*\n\nPor gentileza nos envie o comprovante por aqui. Obrigado!`;
    }

    setWaPreview(preview);
    setWaModalOpen(true);
  }

  async function handleSendWhatsApp(mode: "api" | "wame") {
    if (!currentCompany?.id || !selectedApp) return;

    const phone = selectedApp.client?.phone || selectedApp.contact?.whatsapp || selectedApp.contact?.phone;
    if (!phone) {
      toast({
        title: "Telefone não encontrado",
        description: "O cliente ou contato deste agendamento não possui telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "wame") {
      const clean = phone.replace(/\D/g, "");
      const full = clean.length <= 11 ? `55${clean}` : clean;
      window.open(`https://wa.me/${full}?text=${encodeURIComponent(waPreview)}`, "_blank");

      await sendWhatsAppMessage(currentCompany.id, {
        to: full,
        message: waPreview,
        appointmentId: selectedApp.id,
        clientId: selectedApp.client_id,
        templateKind: waKind,
      });
      setWaModalOpen(false);
      return;
    }

    setWaSending(true);
    const res: any = await sendAppointmentWhatsAppNotification(currentCompany.id, selectedApp.id, waKind);
    setWaSending(false);

    if (res.error && !res.waLink) {
      toast({ title: "Erro ao enviar", description: res.error, variant: "destructive" });
    } else {
      toast({
        title: res.deliveredViaApi ? "Enviado via WhatsApp!" : "Link gerado com sucesso",
        description: res.deliveredViaApi
          ? "Mensagem entregue via API."
          : "Redirecionando para o WhatsApp Web.",
      });
      if (res.waLink && !res.deliveredViaApi) {
        window.open(res.waLink, "_blank");
      }
      setWaModalOpen(false);
    }
  }

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: "",
      description: "",
      client_id: "",
      contact_id: "",
      starts_at: "",
      ends_at: "",
      status: "scheduled",
    },
  });

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadData = useCallback(async () => {
    if (!currentCompany?.id) {
      setAppointments([]);
      setClients([]);
      setContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [appsRes, clsRes, ctsRes] = await Promise.all([
      listAppointments(currentCompany.id),
      listClientsByCompany(currentCompany.id),
      listContacts(currentCompany.id),
    ]);
    if (!appsRes.error && appsRes.data) setAppointments(appsRes.data);
    if (!clsRes.error && clsRes.data) setClients(clsRes.data);
    if (!ctsRes.error && ctsRes.data) setContacts(ctsRes.data);
    setLoading(false);
  }, [currentCompany?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function onSubmit(data: AppointmentFormData) {
    if (!currentCompany?.id) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("client_id", data.client_id || "");
    formData.append("contact_id", data.contact_id || "");
    formData.append("starts_at", data.starts_at);
    formData.append("ends_at", data.ends_at);
    formData.append("status", data.status);

    const res = await createAppointment(currentCompany.id, {}, formData);
    setSaving(false);
    if (!res.error) {
      form.reset({ status: "scheduled" });
      setOpen(false);
      await loadData();
      toast({ title: "Compromisso salvo", description: "O agendamento foi registrado com sucesso." });
    } else {
      toast({
        title: "Erro ao agendar",
        description: typeof res.error === "string" ? res.error : "Verifique os dados preenchidos",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!currentCompany?.id) return;
    if (!confirm("Tem certeza que deseja cancelar e excluir este compromisso?")) return;
    const res = await deleteAppointment(currentCompany.id, id);
    if (!res.error) {
      await loadData();
      toast({ title: "Excluído", description: "Compromisso removido com sucesso." });
    } else {
      toast({ title: "Erro ao excluir", description: res.error, variant: "destructive" });
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
      scheduled: { label: "Agendado", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      completed: { label: "Concluído", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const item = map[s] ?? { label: s, variant: "outline" };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  const filtered = appointments.filter((a) => {
    if (!filterDate) return true;
    return a.starts_at.startsWith(filterDate);
  });

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando agenda…</div>;
  }

  if (!currentCompany) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-input">
        <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Nenhuma empresa selecionada</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecione uma empresa para visualizar a agenda de compromissos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secjessica-900">Agenda</h1>
          <p className="text-muted-foreground">
            Compromissos e consultas da empresa <span className="font-semibold text-secjessica-700">{currentCompany.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-10 w-44 bg-card"
          />
          {filterDate && (
            <Button variant="ghost" size="sm" onClick={() => setFilterDate("")}>
              Limpar filtro
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
                <Plus className="h-4 w-4 mr-1" /> Novo compromisso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Novo compromisso</CardTitle>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Título do compromisso</Label>
                  <Input {...form.register("title")} placeholder="Ex: Consulta de retorno" required />
                  {form.formState.errors.title && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>
                <div>
                  <Label>Descrição / Pauta</Label>
                  <Textarea {...form.register("description")} placeholder="Observações e detalhes do compromisso" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <Select
                      onValueChange={(val) => form.setValue("client_id", val === "none" ? "" : val)}
                      defaultValue={form.getValues("client_id") || "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contato</Label>
                    <Select
                      onValueChange={(val) => form.setValue("contact_id", val === "none" ? "" : val)}
                      defaultValue={form.getValues("contact_id") || "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data e hora de início</Label>
                    <Input {...form.register("starts_at")} type="datetime-local" required />
                  </div>
                  <div>
                    <Label>Data e hora de término</Label>
                    <Input {...form.register("ends_at")} type="datetime-local" required />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    defaultValue={form.getValues("status") || "scheduled"}
                    onValueChange={(val) => form.setValue("status", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-secjessica-600 hover:bg-secjessica-500 text-white">
                    {saving ? "Salvando…" : "Salvar compromisso"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border border-input bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input bg-secondary text-left text-xs font-semibold text-muted-foreground">
                <th className="p-4">Data / Horário</th>
                <th className="p-4">Título</th>
                <th className="p-4">Cliente vinculado</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const starts = new Date(a.starts_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const ends = new Date(a.ends_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={a.id} className="border-b border-input/50 hover:bg-secondary/40 transition-colors">
                    <td className="p-4 font-medium text-foreground">
                      {starts} - {ends}
                    </td>
                    <td className="p-4 font-medium">{a.title}</td>
                    <td className="p-4 text-muted-foreground">{a.client?.name ?? "—"}</td>
                    <td className="p-4">{statusBadge(a.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openWhatsAppDispatch(a, "confirmation")}
                          className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Enviar notificação de WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(a.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir compromisso"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum compromisso encontrado{filterDate ? " para a data selecionada." : ". Clique em \"Novo compromisso\" para agendar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DISPARO DE WHATSAPP DA AGENDA */}
      <Dialog open={waModalOpen} onOpenChange={setWaModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-secjessica-900">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Enviar WhatsApp do Compromisso
            </DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 pt-2">
              <div className="bg-secondary/50 p-3 rounded-lg text-xs space-y-1">
                <p><b>Compromisso:</b> {selectedApp.title}</p>
                <p><b>Cliente:</b> {selectedApp.client?.name || selectedApp.contact?.name || "Sem cliente"}</p>
                <p><b>Destino:</b> {selectedApp.client?.phone || selectedApp.contact?.whatsapp || selectedApp.contact?.phone || "Não cadastrado"}</p>
              </div>

              {/* Botões de Seleção do Modelo */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={waKind === "confirmation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => openWhatsAppDispatch(selectedApp, "confirmation")}
                  className={`text-xs h-7 ${waKind === "confirmation" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
                >
                  Confirmação
                </Button>
                <Button
                  type="button"
                  variant={waKind === "reminder" ? "default" : "outline"}
                  size="sm"
                  onClick={() => openWhatsAppDispatch(selectedApp, "reminder")}
                  className={`text-xs h-7 ${waKind === "reminder" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
                >
                  <Clock className="h-3 w-3 mr-1" /> Lembrete
                </Button>
                <Button
                  type="button"
                  variant={waKind === "pix" ? "default" : "outline"}
                  size="sm"
                  onClick={() => openWhatsAppDispatch(selectedApp, "pix")}
                  className={`text-xs h-7 ${waKind === "pix" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
                >
                  <DollarSign className="h-3 w-3 mr-1" /> Chave Pix
                </Button>
              </div>

              <div>
                <Label className="text-xs">Mensagem editável:</Label>
                <Textarea
                  value={waPreview}
                  onChange={(e) => setWaPreview(e.target.value)}
                  rows={7}
                  className="text-xs font-mono mt-1"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSendWhatsApp("wame")}
                  className="text-xs h-9 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Abrir no WhatsApp Web
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSendWhatsApp("api")}
                  disabled={waSending}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {waSending ? "Enviando…" : "Disparar via API"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
