"use client";

import { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  Calendar,
  Building2,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PhoneCall,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface FAQItem {
  id: string;
  category: "whatsapp" | "agenda" | "empresas" | "seguranca" | "atalhos";
  question: string;
  answer: string;
  badge?: string;
}

const FAQS: FAQItem[] = [
  {
    id: "wa-1",
    category: "whatsapp",
    badge: "Essencial",
    question: "Como conectar o WhatsApp da empresa para atendimento?",
    answer:
      "Acesse o menu WhatsApp na barra lateral, clique na aba 'Conexão & QR Code'. Clique no botão 'Conectar / Gerar QR Code'. No celular do WhatsApp de atendimento, abra o aplicativo, toque nos 3 pontinhos (ou Ajustes no iPhone) > 'Aparelhos conectados' > 'Conectar um aparelho' e aponte a câmera para o QR Code na tela. Em instantes a conexão estará ativa e o indicador ficará verde.",
  },
  {
    id: "wa-2",
    category: "whatsapp",
    badge: "WhatsApp Web",
    question: "Posso usar o WhatsApp sem ter um servidor pago de API?",
    answer:
      "Sim! O SecJessica possui modo híbrido exclusivo: todas as mensagens e agendamentos contam com o botão 'Abrir no WhatsApp Web (wa.me)'. Ao clicar, a conversa oficial do WhatsApp Web é aberta com o número do cliente e a mensagem toda preenchida e formatada com 1 clique, sem custo de API.",
  },
  {
    id: "wa-3",
    category: "whatsapp",
    badge: "Automação",
    question: "Como funciona a auto-confirmação quando o paciente responde '1'?",
    answer:
      "Quando o paciente responde à mensagem de confirmação com '1', 'Sim' ou 'Confirmo', o Webhook do SecJessica identifica automaticamente o agendamento correspondente e altera o status para 'Confirmado' na sua agenda, disparando uma notificação interna para que você não precise checar manualmente.",
  },
  {
    id: "wa-4",
    category: "whatsapp",
    question: "O que acontece se o cliente responder '2' para reagendar?",
    answer:
      "Se o cliente responder com '2', 'Reagendar' ou 'Cancelar', o sistema cria imediatamente uma Tarefa Prioritária no menu Tarefas com a descrição da solicitação, permitindo que a secretária entre em contato e ofereça novos horários vagos.",
  },
  {
    id: "wa-5",
    category: "atalhos",
    badge: "Produtividade",
    question: "Como funcionam as Respostas Rápidas e os atalhos como /pix?",
    answer:
      "Na aba 'Respostas Rápidas' do menu WhatsApp, você pode cadastrar mensagens padrão como /confirmar, /pix, /endereco e /preparo. Ao digitar ou selecionar o atalho, a mensagem inteira é inserida no campo de texto pronta para envio.",
  },
  {
    id: "agenda-1",
    category: "agenda",
    badge: "Google Agenda",
    question: "Como sincronizar os compromissos com o Google Agenda do médico?",
    answer:
      "Acesse o menu 'Google Agenda' no menu lateral. Clique em 'Conectar Google Agenda' e faça login com a conta Google do profissional. Uma vez autorizado, todos os compromissos criados no SecJessica serão sincronizados em tempo real com a agenda do Google e vice-versa.",
  },
  {
    id: "agenda-2",
    category: "agenda",
    question: "Como enviar a notificação de confirmação direto da Agenda?",
    answer:
      "Na tabela do menu Agenda, ao lado de cada compromisso há o ícone verde do WhatsApp. Basta clicar nele para abrir a janela de pré-visualização com 3 modelos prontos (Confirmação, Lembrete 24h ou Cobrança Pix). Você pode editar qualquer palavra e disparar via API ou WhatsApp Web.",
  },
  {
    id: "empresas-1",
    category: "empresas",
    badge: "Multi-Tenant",
    question: "Como alternar entre diferentes consultórios e empresas?",
    answer:
      "No topo superior direito do painel, clique no seletor de empresa. Todos os clientes, contatos, agenda, tarefas e mensagens serão imediatamente filtrados para a empresa selecionada. Graças às políticas RLS do banco de dados, os dados de uma empresa nunca se misturam com os de outra.",
  },
  {
    id: "seguranca-1",
    category: "seguranca",
    badge: "LGPD",
    question: "O sistema está em conformidade com a LGPD e sigilo profissional?",
    answer:
      "Sim. O SecJessica utiliza arquitetura Supabase com Row Level Security (RLS) em nível de banco de dados PostgreSQL. Toda ação (atualização cadastral, envio de mensagem, criação de tarefas) gera um Log de Auditoria na tabela audit_logs, registrando data, usuário, IP e ação realizada para total conformidade legal.",
  },
];

export default function AjudaPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ "wa-1": true, "wa-2": true });

  function toggleItem(id: string) {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filteredFaqs = FAQS.filter((f) => {
    if (selectedCategory !== "all" && f.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner Superior da Central de Ajuda */}
      <div className="rounded-2xl border border-secjessica-200 bg-gradient-to-r from-secjessica-900 via-secjessica-800 to-secjessica-950 p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-secjessica-600/30 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5" />
            Central de Ajuda & Documentação Oficial
          </div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold tracking-tight">
            Como podemos ajudar seu dia de trabalho?
          </h1>
          <p className="text-sm text-secjessica-100/90 max-w-2xl leading-relaxed">
            Consulte respostas rápidas, tutoriais de uso do WhatsApp, sincronização com o Google Agenda e boas práticas para secretariado remoto com excelência.
          </p>

          <div className="relative max-w-md pt-2">
            <Search className="h-4 w-4 absolute left-3 top-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por dúvida, atalho ou recurso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white text-foreground text-xs h-10 rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Categorias Rápidas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "Todas as Dúvidas", icon: HelpCircle },
          { id: "whatsapp", label: "WhatsApp & Atendimento", icon: MessageSquare },
          { id: "agenda", label: "Agenda & Google", icon: Calendar },
          { id: "empresas", label: "Multi-Empresa", icon: Building2 },
          { id: "atalhos", label: "Respostas Rápidas", icon: Sparkles },
          { id: "seguranca", label: "LGPD & Segurança", icon: ShieldCheck },
        ].map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-secjessica-600 text-white shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Lista de Acordeões / FAQ */}
      <div className="bg-card rounded-2xl border border-input shadow-xs p-6 space-y-3">
        <h2 className="text-base font-semibold text-secjessica-900 mb-4 flex items-center justify-between">
          <span>Artigos e Perguntas Frequentes</span>
          <span className="text-xs font-normal text-muted-foreground">
            {filteredFaqs.length} tópicos encontrados
          </span>
        </h2>

        <div className="divide-y divide-border/60">
          {filteredFaqs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <div key={faq.id} className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="w-full flex items-center justify-between text-left gap-3 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-secjessica-700 transition-colors">
                      {faq.question}
                    </span>
                    {faq.badge && (
                      <Badge variant="outline" className="text-[10px] py-0 px-2 text-secjessica-700 bg-secjessica-50 border-secjessica-200">
                        {faq.badge}
                      </Badge>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-1 bg-secondary/30 p-3 rounded-lg border border-border/40">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm">Nenhum resultado encontrado para sua busca.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchTerm("");
                }}
                className="mt-2 text-xs text-secjessica-600"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cartões de Acesso aos Documentos Completos e Suporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-secjessica-50 to-amber-50/50 p-5 rounded-2xl border border-secjessica-200/80 space-y-3">
          <div className="flex items-center gap-2 text-secjessica-900 font-semibold text-sm">
            <FileText className="h-4 w-4 text-secjessica-600" />
            Documentação Técnica & Manuais em Markdown
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Todos os manuais e relatórios de auditoria estão disponíveis na pasta <code>docs/</code> do projeto:
          </p>
          <ul className="text-xs text-secjessica-800 space-y-1 list-disc pl-5">
            <li><b>docs/MANUAL_DA_SECRETARIA.md</b> — Guia passo a passo operacional</li>
            <li><b>docs/GUIA_WHATSAPP_EVOLUTION_API.md</b> — Instalação e Webhooks</li>
            <li><b>docs/AUDITORIA_SEO_COMPLETA.md</b> — Relatório de SEO e indexação</li>
            <li><b>docs/LGPD_E_SEGURANCA_DE_DADOS.md</b> — Políticas e conformidade</li>
          </ul>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-input shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <PhoneCall className="h-4 w-4 text-emerald-600" />
              Suporte Técnico do Responsável
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Dúvidas sobre credenciais, conexões com Google Agenda ou servidores? Entre em contato diretamente com o desenvolvedor do sistema.
            </p>
          </div>

          <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-3 text-xs">
            <a
              href="https://wa.me/5524988212712"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-700 font-medium hover:underline"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp: (24) 98821-2712
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="mailto:vitorhugo1@gmail.com"
              className="inline-flex items-center gap-1.5 text-secjessica-700 font-medium hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              vitorhugo1@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
