/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  MessageSquare,
  QrCode,
  Send,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Sparkles,
  Zap,
  CalendarCheck2,
  Plus,
  Trash2,
  DollarSign,
  PhoneCall,
  Search,
} from "lucide-react";
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  connectWhatsAppInstance,
  disconnectWhatsAppInstance,
  sendWhatsAppMessage,
  sendAppointmentWhatsAppNotification,
  listWhatsAppMessages,
  listQuickReplies,
  createQuickReply,
  deleteQuickReply,
  type WhatsAppConfigData,
} from "@/features/whatsapp/actions";
import { listAppointments } from "@/features/scheduling/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WhatsAppHubPage() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"inbox" | "agenda" | "replies" | "config">("inbox");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Composer State
  const [composerPhone, setComposerPhone] = useState("");
  const [composerText, setComposerText] = useState("");
  const [filterDirection, setFilterDirection] = useState<"all" | "inbound" | "outbound">("all");
  const [searchMsg, setSearchMsg] = useState("");

  // Quick Reply Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [newReplyTitle, setNewReplyTitle] = useState("");
  const [newReplyShortcut, setNewReplyShortcut] = useState("");
  const [newReplyContent, setNewReplyContent] = useState("");

  // Appointment Dispatch Preview Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [dispatchKind, setDispatchKind] = useState<"confirmation" | "reminder" | "pix" | "cancellation">("confirmation");
  const [dispatchPreview, setDispatchPreview] = useState("");

  // Carrega todos os dados da empresa ativa
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadData = useCallback(async () => {
    if (!currentCompany?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cfgRes, msgRes, repRes, appRes] = await Promise.all([
        getWhatsAppConfig(currentCompany.id),
        listWhatsAppMessages(currentCompany.id, 50),
        listQuickReplies(currentCompany.id),
        listAppointments(currentCompany.id),
      ]);

      if (cfgRes.data) setConfig(cfgRes.data);
      if (msgRes.data) setMessages(msgRes.data);
      if (repRes.data) setQuickReplies(repRes.data);
      if (appRes.data) setAppointments(appRes.data);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar dados",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  // Salva configurações da instância
  async function handleSaveConfig(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentCompany?.id) return;
    setActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await saveWhatsAppConfig(currentCompany.id, {}, formData);
    setActionLoading(false);

    if (res.error) {
      toast({
        title: "Erro ao salvar",
        description: typeof res.error === "string" ? res.error : "Verifique os campos informados",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configurações salvas",
        description: "Parâmetros do WhatsApp atualizados com sucesso.",
      });
      await loadData();
    }
  }

  // Conectar / Gerar QR Code
  async function handleConnect() {
    if (!currentCompany?.id) return;
    setActionLoading(true);
    const res = await connectWhatsAppInstance(currentCompany.id);
    setActionLoading(false);

    if (res.error) {
      toast({ title: "Erro na conexão", description: res.error, variant: "destructive" });
    } else {
      toast({
        title: "WhatsApp conectado!",
        description: "Instância pronta para envios e atendimentos.",
      });
      await loadData();
    }
  }

  // Desconectar
  async function handleDisconnect() {
    if (!currentCompany?.id) return;
    if (!confirm("Deseja realmente desconectar esta instância do WhatsApp?")) return;
    setActionLoading(true);
    const res = await disconnectWhatsAppInstance(currentCompany.id);
    setActionLoading(false);

    if (res.error) {
      toast({ title: "Erro ao desconectar", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Desconectado", description: "Instância desativada." });
      await loadData();
    }
  }

  // Enviar Mensagem Direta
  async function handleSendMessage(mode: "api" | "wame") {
    if (!currentCompany?.id || !composerPhone || !composerText) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o telefone e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "wame") {
      const cleanPhone = composerPhone.replace(/\D/g, "");
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(composerText)}`;
      window.open(url, "_blank");

      // Registra mensagem enviada localmente
      await sendWhatsAppMessage(currentCompany.id, {
        to: composerPhone,
        message: composerText,
        templateKind: "manual_wame",
      });
      setComposerText("");
      await loadData();
      return;
    }

    setActionLoading(true);
    const res = await sendWhatsAppMessage(currentCompany.id, {
      to: composerPhone,
      message: composerText,
    });
    setActionLoading(false);

    if (res.error && !res.waLink) {
      toast({ title: "Erro no envio", description: res.error, variant: "destructive" });
    } else {
      toast({
        title: res.deliveredViaApi ? "Mensagem enviada via API!" : "Pronto para envio",
        description: res.deliveredViaApi
          ? "Entregue com sucesso ao WhatsApp do destinatário."
          : "Link wa.me gerado. Caso a API não esteja ativa, use o botão WhatsApp Web.",
      });
      if (res.waLink && !res.deliveredViaApi) {
        window.open(res.waLink, "_blank");
      }
      setComposerText("");
      await loadData();
    }
  }

  // Inserir atalho de resposta rápida no composer
  function applyQuickReply(content: string) {
    setComposerText((prev) => (prev ? `${prev}\n${content}` : content));
  }

  // Criar Resposta Rápida
  async function handleCreateQuickReply(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany?.id) return;

    setActionLoading(true);
    const formData = new FormData();
    formData.append("title", newReplyTitle);
    formData.append("shortcut", newReplyShortcut);
    formData.append("content", newReplyContent);

    const res = await createQuickReply(currentCompany.id, {}, formData);
    setActionLoading(false);

    if (res.error) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Resposta rápida cadastrada!" });
      setReplyModalOpen(false);
      setNewReplyTitle("");
      setNewReplyShortcut("");
      setNewReplyContent("");
      await loadData();
    }
  }

  // Excluir Resposta Rápida
  async function handleDeleteQuickReply(id: string) {
    if (!currentCompany?.id) return;
    if (!confirm("Deseja excluir este atalho de resposta rápida?")) return;
    const res = await deleteQuickReply(currentCompany.id, id);
    if (!res.error) {
      toast({ title: "Excluído com sucesso" });
      await loadData();
    }
  }

  // Copiar Texto para Área de Transferência
  function copyToClipboard(text: string, label = "Texto copiado") {
    navigator.clipboard.writeText(text);
    toast({ title: label });
  }

  // Abrir Modal de Disparo da Agenda
  function openAppointmentDispatch(app: any, kind: "confirmation" | "reminder" | "pix" | "cancellation") {
    setSelectedApp(app);
    setDispatchKind(kind);

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
      preview = `⏰ *Lembrete de Compromisso*\n\nOlá, *${clientName}*! Lembramos do seu agendamento amanhã:\n\n📌 *Assunto:* ${app.title}\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\nEstamos ansiosos pelo seu atendimento!`;
    } else if (kind === "pix") {
      preview = `💳 *Orientações de Pagamento / Chave Pix*\n\nOlá, *${clientName}*! Seguem os dados para confirmação da sua reserva para ${formattedDate}:\n\n🔑 *Chave Pix:* ${currentCompany?.phone || "contato@secjessica.com.br"}\nBeneficiário: *${companyName}*\n\nPor gentileza nos envie o comprovante por aqui. Obrigado!`;
    } else if (kind === "cancellation") {
      preview = `⚠️ *Cancelamento de Agendamento*\n\nOlá, *${clientName}*, confirmamos o cancelamento do agendamento *"${app.title}"* em ${formattedDate} às ${formattedTime}. Caso queira reagendar, conte conosco!`;
    }

    setDispatchPreview(preview);
    setDispatchModalOpen(true);
  }

  // Executar Disparo da Agenda
  async function executeAppointmentDispatch(mode: "api" | "wame") {
    if (!currentCompany?.id || !selectedApp) return;

    if (mode === "wame") {
      const phone = selectedApp.client?.phone || selectedApp.contact?.whatsapp || selectedApp.contact?.phone;
      if (!phone) {
        toast({ title: "Telefone não cadastrado no cliente", variant: "destructive" });
        return;
      }
      const cleanPhone = phone.replace(/\D/g, "");
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(dispatchPreview)}`, "_blank");

      // Registra mensagem
      await sendWhatsAppMessage(currentCompany.id, {
        to: fullPhone,
        message: dispatchPreview,
        appointmentId: selectedApp.id,
        clientId: selectedApp.client_id,
        templateKind: dispatchKind,
      });
      setDispatchModalOpen(false);
      await loadData();
      return;
    }

    setActionLoading(true);
    const res: any = await sendAppointmentWhatsAppNotification(currentCompany.id, selectedApp.id, dispatchKind);
    setActionLoading(false);

    if (res.error && !res.waLink) {
      toast({ title: "Erro ao enviar notificação", description: res.error, variant: "destructive" });
    } else {
      toast({
        title: res.deliveredViaApi ? "Notificação enviada via WhatsApp!" : "Link do WhatsApp Gerado",
        description: res.deliveredViaApi
          ? "Mensagem entregue com sucesso ao cliente."
          : "Redirecionando para o WhatsApp Web.",
      });
      if (res.waLink && !res.deliveredViaApi) {
        window.open(res.waLink, "_blank");
      }
      setDispatchModalOpen(false);
      await loadData();
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin text-secjessica-600" />
        <p>Carregando Central do WhatsApp…</p>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-input">
        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Nenhuma empresa selecionada</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione uma empresa no topo para acessar a central de atendimento WhatsApp.
        </p>
      </div>
    );
  }

  const isConnected = config?.status === "connected";
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/whatsapp/webhook?company_id=${currentCompany.id}` : "";

  // Filtragem de mensagens
  const filteredMessages = messages.filter((m) => {
    if (filterDirection !== "all" && m.direction !== filterDirection) return false;
    if (searchMsg) {
      const q = searchMsg.toLowerCase();
      return (
        m.message?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.client?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-transparent p-5 rounded-2xl border border-emerald-500/20">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-secjessica-900">WhatsApp Atendimento & Agenda</h1>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={
                  isConnected
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white flex items-center gap-1.5"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }
              >
                <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-white animate-pulse" : "bg-amber-500"}`} />
                {isConnected ? "Instância Conectada" : "Modo Manual / Desconectado"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Empresa: <span className="font-semibold text-secjessica-800">{currentCompany.name}</span> • Provedor:{" "}
              <span className="capitalize font-mono">{config?.provider || "Evolution API"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={actionLoading}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${actionLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="text-xs h-9 text-red-600 border-red-200 hover:bg-red-50"
            >
              Desconectar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={actionLoading}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <QrCode className="h-3.5 w-3.5 mr-1.5" />
              Conectar WhatsApp
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === "inbox"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="h-4 w-4" />
          Atendimento & Mensagens
          <Badge variant="secondary" className="text-[10px] ml-1">
            {messages.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("agenda")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === "agenda"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarCheck2 className="h-4 w-4" />
          Disparos da Agenda
          <Badge variant="secondary" className="text-[10px] ml-1">
            {appointments.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("replies")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === "replies"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="h-4 w-4" />
          Respostas Rápidas
          <Badge variant="secondary" className="text-[10px] ml-1">
            {quickReplies.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === "config"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="h-4 w-4" />
          Conexão & QR Code
        </button>
      </div>

      {/* TAB 1: ATENDIMENTO & MENSAGENS */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mensageiro / Composer à Esquerda */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card p-5 rounded-xl border border-input shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-secjessica-900">
                  <Send className="h-4 w-4 text-emerald-600" />
                  Novo Envio Rápido
                </h3>
                <span className="text-[11px] text-muted-foreground">Manual ou API</span>
              </div>

              <div>
                <Label className="text-xs">Telefone do Destinatário</Label>
                <Input
                  placeholder="Ex: (11) 98765-4321 ou 5511..."
                  value={composerPhone}
                  onChange={(e) => setComposerPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Mensagem</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {composerText.length} caracteres
                  </span>
                </div>
                <Textarea
                  placeholder="Digite sua mensagem ou selecione um atalho rápido abaixo..."
                  rows={4}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              {/* Atalhos Rápidos Clicáveis */}
              <div>
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Inserir Resposta Rápida:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {quickReplies.map((qr) => (
                    <button
                      key={qr.id || qr.shortcut}
                      type="button"
                      onClick={() => applyQuickReply(qr.content)}
                      className="text-[11px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded-md border border-input text-foreground font-mono transition-colors"
                      title={qr.title}
                    >
                      {qr.shortcut}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Envio Duplo */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSendMessage("wame")}
                  className="text-xs h-9 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
                  title="Abre o WhatsApp Web imediatamente com a mensagem pré-carregada"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Abrir wa.me
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSendMessage("api")}
                  disabled={actionLoading}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                  title="Dispara automaticamente em segundo plano pela API"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Disparar API
                </Button>
              </div>
            </div>

            {/* Dica da Secretária Remota */}
            <div className="bg-emerald-50/60 border border-emerald-200/60 p-4 rounded-xl text-xs text-emerald-900 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Dica Operacional SecJessica:
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Você pode utilizar o botão <b>Abrir wa.me</b> mesmo sem ter contratado ou conectado servidores de API. Ele abre a janela de conversa oficial do WhatsApp Web com a mensagem pré-digitada com um só clique!
              </p>
            </div>
          </div>

          {/* Feed de Histórico de Mensagens à Direita */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card p-4 rounded-xl border border-input shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-secjessica-900">Histórico de Atendimentos</h3>
                  <Badge variant="outline" className="text-xs">
                    {filteredMessages.length} exibidas
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por texto ou número..."
                      value={searchMsg}
                      onChange={(e) => setSearchMsg(e.target.value)}
                      className="h-8 pl-8 text-xs w-48"
                    />
                  </div>

                  <select
                    value={filterDirection}
                    onChange={(e: any) => setFilterDirection(e.target.value)}
                    className="h-8 text-xs bg-background border border-input rounded-md px-2"
                  >
                    <option value="all">Todas</option>
                    <option value="inbound">Recebidas</option>
                    <option value="outbound">Enviadas</option>
                  </select>
                </div>
              </div>

              {/* Lista de Mensagens estilo Chat */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredMessages.map((msg) => {
                  const isInbound = msg.direction === "inbound";
                  const createdAt = new Date(msg.created_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col p-3 rounded-xl border transition-all ${
                        isInbound
                          ? "bg-slate-50 border-slate-200/80 mr-8"
                          : "bg-emerald-50/50 border-emerald-200/70 ml-8"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          {isInbound ? (
                            <span className="text-blue-600">👤 {msg.client?.name || msg.contact?.name || msg.phone}</span>
                          ) : (
                            <span className="text-emerald-700">💼 Jéssica / Sistema ({msg.template_kind})</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span>{createdAt}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                              msg.status === "received"
                                ? "bg-blue-100 text-blue-700"
                                : msg.status === "delivered"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {msg.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs whitespace-pre-line text-foreground/90 leading-relaxed">
                        {msg.message}
                      </p>

                      <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.message, "Mensagem copiada")}
                          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copiar
                        </button>

                        <a
                          href={`https://wa.me/${msg.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 font-medium hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Conversar no WhatsApp ({msg.phone})
                        </a>
                      </div>
                    </div>
                  );
                })}

                {filteredMessages.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm">Nenhuma mensagem registrada no histórico.</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      Envie uma nova mensagem ao lado ou aguarde o recebimento via Webhook.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISPAROS DA AGENDA */}
      {activeTab === "agenda" && (
        <div className="space-y-4">
          <div className="bg-card p-5 rounded-xl border border-input shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-secjessica-900">
                  Agendamentos & Automação de Confirmações
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dispare confirmações, lembretes 24h e cobranças Pix para os pacientes e clientes agendados.
                </p>
              </div>
              <Badge variant="outline" className="text-xs self-start md:self-auto">
                {appointments.length} compromissos cadastrados
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary text-left font-semibold text-muted-foreground border-b border-border">
                    <th className="p-3">Data & Horário</th>
                    <th className="p-3">Compromisso</th>
                    <th className="p-3">Cliente / Contato</th>
                    <th className="p-3">Telefone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações de WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {appointments.map((app) => {
                    const starts = new Date(app.starts_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const phone =
                      app.client?.phone || app.contact?.whatsapp || app.contact?.phone || "—";

                    return (
                      <tr key={app.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3 font-medium whitespace-nowrap">{starts}</td>
                        <td className="p-3 font-semibold text-foreground">{app.title}</td>
                        <td className="p-3 text-muted-foreground">
                          {app.client?.name || app.contact?.name || "Sem cliente"}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{phone}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                              app.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : app.status === "scheduled"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAppointmentDispatch(app, "confirmation")}
                              className="h-7 text-[11px] px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              title="Enviar solicitação de confirmação"
                            >
                              <CalendarCheck2 className="h-3 w-3 mr-1" />
                              Confirmar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAppointmentDispatch(app, "reminder")}
                              className="h-7 text-[11px] px-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                              title="Enviar lembrete 24h antes"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Lembrete
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAppointmentDispatch(app, "pix")}
                              className="h-7 text-[11px] px-2 text-purple-700 border-purple-300 hover:bg-purple-50"
                              title="Enviar dados e chave Pix"
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Pix
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum agendamento encontrado para esta empresa. Cadastre novos compromissos na aba Agenda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESPOSTAS RÁPIDAS */}
      {activeTab === "replies" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-secjessica-900">Modelos de Respostas Rápidas</h3>
              <p className="text-xs text-muted-foreground">
                Crie mensagens padronizadas e use atalhos como <code>/pix</code>, <code>/confirmar</code>, <code>/endereco</code> para economizar tempo no atendimento.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setReplyModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova Resposta Rápida
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickReplies.map((qr) => (
              <div
                key={qr.id || qr.shortcut}
                className="bg-card p-4 rounded-xl border border-input shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-foreground">{qr.title}</span>
                    <Badge variant="secondary" className="font-mono text-xs text-emerald-800 bg-emerald-50 border-emerald-200">
                      {qr.shortcut}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                    {qr.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(qr.content, "Texto do modelo copiado")}
                    className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>

                  {qr.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuickReply(qr.id)}
                      className="text-xs h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONEXÃO & QR CODE */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel do QR Code à Esquerda */}
          <div className="lg:col-span-1 bg-card p-6 rounded-xl border border-input shadow-sm flex flex-col items-center text-center space-y-4">
            <h3 className="font-semibold text-sm text-secjessica-900">QR Code da Instância</h3>
            <div className="w-56 h-56 rounded-xl border-2 border-dashed border-emerald-500/40 p-3 bg-secondary/30 flex items-center justify-center">
              {config?.qr_code_base64 ? (
                <img
                  src={config.qr_code_base64}
                  alt="QR Code WhatsApp"
                  className="w-full h-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground gap-2 p-4">
                  <QrCode className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-xs">
                    {isConnected
                      ? "Aparelho conectado e sincronizado com o SecJessica!"
                      : "Clique em 'Gerar QR Code' para parear seu celular."}
                  </p>
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <Button
                onClick={handleConnect}
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${actionLoading ? "animate-spin" : ""}`} />
                {isConnected ? "Reconectar / Atualizar QR Code" : "Conectar / Gerar QR Code"}
              </Button>

              {isConnected && (
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="w-full text-xs h-9 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Desconectar Instância
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground text-left leading-relaxed">
              1. Abra o WhatsApp no seu smartphone.<br />
              2. Toque em <b>Aparelhos Conectados &gt; Conectar um aparelho</b>.<br />
              3. Aponte a câmera para o QR Code acima.
            </p>
          </div>

          {/* Configurações de API & Webhook à Direita */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleSaveConfig} className="bg-card p-6 rounded-xl border border-input shadow-sm space-y-5">
              <div>
                <h3 className="font-semibold text-base text-secjessica-900">Configuração de Servidor & Provedor</h3>
                <p className="text-xs text-muted-foreground">
                  Integre com Evolution API (Open-source/VPS), Z-API ou Meta Cloud API.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Provedor WhatsApp</Label>
                  <select
                    name="provider"
                    defaultValue={config?.provider || "evolution_api"}
                    className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="evolution_api">Evolution API (Recomendado / Auto-hospedado)</option>
                    <option value="z_api">Z-API</option>
                    <option value="meta_cloud">Meta Cloud API (Oficial)</option>
                    <option value="manual">Modo Manual (wa.me direto sem servidor)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Nome da Instância</Label>
                  <Input
                    name="instance_name"
                    defaultValue={config?.instance_name || `secjessica-${currentCompany.id.slice(0, 8)}`}
                    required
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">URL da API (Endpoint)</Label>
                  <Input
                    name="api_url"
                    defaultValue={config?.api_url || ""}
                    placeholder="https://api-whatsapp.suaempresa.com"
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Chave de API (ApiKey / Token)</Label>
                  <Input
                    type="password"
                    name="api_key"
                    defaultValue={config?.api_key || ""}
                    placeholder="••••••••••••••••"
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs">Número Oficial Conectado (com DDD)</Label>
                  <Input
                    name="phone_number"
                    defaultValue={config?.phone_number || ""}
                    placeholder="(11) 98765-4321"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Automações Inteligentes */}
              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Regras de Automação da Secretária Jéssica
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      name="auto_confirm_appointments"
                      defaultChecked={config?.auto_confirm_appointments ?? true}
                      className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <b>Auto-confirmação de agendamentos:</b> Marca automaticamente o status do agendamento como &quot;Confirmado&quot; quando o cliente responder &quot;1&quot;, &quot;Sim&quot; ou &quot;Confirmo&quot;.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      name="business_hours_only"
                      defaultChecked={config?.business_hours_only ?? true}
                      className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <b>Disparos apenas em horário comercial:</b> Evita incomodar clientes fora do horário útil (08:00 às 19:00).
                    </span>
                  </label>
                </div>
              </div>

              {/* Webhook URL para Copiar */}
              <div className="pt-4 border-t border-border space-y-1.5">
                <Label className="text-xs">URL do Webhook para Recebimento Automático</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="text-xs font-mono bg-secondary/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl, "URL do webhook copiada")}
                    className="text-xs h-9"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copiar
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cole este endereço nas configurações de webhook da Evolution API ou Z-API para receber mensagens recebidas e respostas em tempo real.
                </p>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-secjessica-600 hover:bg-secjessica-500 text-white text-xs h-9"
                >
                  Salvar Configurações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA RESPOSTA RÁPIDA */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Resposta Rápida</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateQuickReply} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Título descritivo</Label>
              <Input
                placeholder="Ex: Instruções de Preparo para Exame"
                value={newReplyTitle}
                onChange={(e) => setNewReplyTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-xs">Atalho (com barra)</Label>
              <Input
                placeholder="Ex: /preparo"
                value={newReplyShortcut}
                onChange={(e) => setNewReplyShortcut(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-xs">Conteúdo da mensagem</Label>
              <Textarea
                placeholder="Digite o texto que será enviado ao cliente..."
                rows={4}
                value={newReplyContent}
                onChange={(e) => setNewReplyContent(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReplyModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Salvar Modelo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: PRÉ-VISUALIZAÇÃO DE DISPARO DA AGENDA */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-emerald-600" />
              Notificação de WhatsApp da Agenda
            </DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4 pt-2">
              <div className="bg-secondary/40 p-3 rounded-lg text-xs space-y-1">
                <p>
                  <b>Compromisso:</b> {selectedApp.title}
                </p>
                <p>
                  <b>Cliente:</b> {selectedApp.client?.name || selectedApp.contact?.name || "Sem cliente"}
                </p>
                <p>
                  <b>Telefone:</b> {selectedApp.client?.phone || selectedApp.contact?.whatsapp || selectedApp.contact?.phone || "Não cadastrado"}
                </p>
              </div>

              <div>
                <Label className="text-xs">Mensagem que será enviada:</Label>
                <Textarea
                  value={dispatchPreview}
                  onChange={(e) => setDispatchPreview(e.target.value)}
                  rows={8}
                  className="text-xs font-mono mt-1"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => executeAppointmentDispatch("wame")}
                  className="text-xs h-9 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Abrir no WhatsApp Web
                </Button>

                <Button
                  type="button"
                  onClick={() => executeAppointmentDispatch("api")}
                  disabled={actionLoading}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Disparar via API
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
