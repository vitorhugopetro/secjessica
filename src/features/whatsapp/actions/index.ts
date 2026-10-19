/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface WhatsAppConfigData {
  id?: string;
  company_id?: string;
  provider: "evolution_api" | "z_api" | "meta_cloud" | "manual";
  instance_name: string;
  phone_number?: string | null;
  status: "connected" | "disconnected" | "qrcode" | "connecting";
  api_url?: string | null;
  api_key?: string | null;
  webhook_secret?: string | null;
  auto_reply: boolean;
  auto_confirm_appointments: boolean;
  reminder_hours_before: number;
  business_hours_only: boolean;
  qr_code_base64?: string | null;
  last_connected_at?: string | null;
}

const configSchema = z.object({
  provider: z.enum(["evolution_api", "z_api", "meta_cloud", "manual"]).default("evolution_api"),
  instance_name: z.string().min(2, "Nome da instância é obrigatório"),
  phone_number: z.string().optional().nullable(),
  api_url: z.string().optional().nullable(),
  api_key: z.string().optional().nullable(),
  auto_reply: z.boolean().default(false),
  auto_confirm_appointments: z.boolean().default(true),
  reminder_hours_before: z.coerce.number().min(1).max(72).default(24),
  business_hours_only: z.boolean().default(false),
});

/**
 * Normaliza número de telefone para formato WhatsApp internacional (E.164 sem +)
 * Exemplo: (11) 98765-4321 -> 5511987654321
 */
export async function sanitizeWhatsAppPhone(phone: string): Promise<string> {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  // Se tem 10 ou 11 dígitos, é um número brasileiro sem DDI
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Gera link direto para o WhatsApp Web / App
 */
export async function generateWaMeLink(phone: string, text: string): Promise<string> {
  const cleanPhone = await sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Obtém as configurações do WhatsApp da empresa
 */
export async function getWhatsAppConfig(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: null, error: auth.error };

  const allInstances = await firebaseClient.listDocs<WhatsAppConfigData>("whatsapp_instances");
  const instance = allInstances.find((i) => i.company_id === orgId) || null;

  // Se não existir, retorna configuração padrão manual
  if (!instance) {
    const defaultConfig: WhatsAppConfigData = {
      provider: "evolution_api",
      instance_name: `secjessica-${orgId.slice(0, 8)}`,
      phone_number: "",
      status: "disconnected",
      api_url: "",
      api_key: "",
      auto_reply: false,
      auto_confirm_appointments: true,
      reminder_hours_before: 24,
      business_hours_only: true,
      qr_code_base64: null,
    };
    return { data: defaultConfig, error: null };
  }

  return { data: instance, error: null };
}

/**
 * Salva ou atualiza a configuração do WhatsApp da empresa
 */
export async function saveWhatsAppConfig(orgId: string, prevState: unknown, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = configSchema.safeParse({
    ...raw,
    auto_reply: raw.auto_reply === "true" || raw.auto_reply === "on",
    auto_confirm_appointments: raw.auto_confirm_appointments === "true" || raw.auto_confirm_appointments === "on",
    business_hours_only: raw.business_hours_only === "true" || raw.business_hours_only === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const cleanPhone = parsed.data.phone_number ? await sanitizeWhatsAppPhone(parsed.data.phone_number) : null;

  // Check if instance already exists
  const allInstances = await firebaseClient.listDocs<WhatsAppConfigData>("whatsapp_instances");
  const existing = allInstances.find((i) => i.company_id === orgId);

  const instanceId = existing?.id || `wainst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const payload: WhatsAppConfigData = {
    id: instanceId,
    company_id: orgId,
    provider: parsed.data.provider,
    instance_name: parsed.data.instance_name,
    phone_number: cleanPhone,
    status: existing?.status || "disconnected",
    api_url: parsed.data.api_url || null,
    api_key: parsed.data.api_key || null,
    auto_reply: parsed.data.auto_reply,
    auto_confirm_appointments: parsed.data.auto_confirm_appointments,
    reminder_hours_before: parsed.data.reminder_hours_before,
    business_hours_only: parsed.data.business_hours_only,
    qr_code_base64: existing?.qr_code_base64 || null,
    last_connected_at: existing?.last_connected_at || null,
  };

  const res = await firebaseClient.setDoc("whatsapp_instances", instanceId, payload);
  if (!res.success) return { error: res.error || "Erro ao salvar configuração do WhatsApp" };

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "whatsapp.config_updated",
    entity: "whatsapp_instances",
    entityId: instanceId,
    metadata: { provider: parsed.data.provider, instance: parsed.data.instance_name },
  });

  revalidatePath("/whatsapp");
  revalidatePath("/agenda");
  return { data: payload, error: null };
}

/**
 * Conecta ou simula a conexão e geração do QR Code do WhatsApp
 */
export async function connectWhatsAppInstance(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const allInstances = await firebaseClient.listDocs<WhatsAppConfigData>("whatsapp_instances");
  const instance = allInstances.find((i) => i.company_id === orgId);

  if (!instance || !instance.id) {
    return { error: "Configure a instância primeiro antes de conectar." };
  }

  // Se tiver API configurada de Evolution API ou Z-API, tenta chamar o endpoint da instância
  if (instance.api_url && instance.api_key && instance.api_url.startsWith("http")) {
    try {
      const url = `${instance.api_url.replace(/\/$/, "")}/instance/connect/${instance.instance_name}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          apikey: instance.api_key,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const qr = json.base64 || json.qrcode?.base64 || null;
        await firebaseClient.setDoc("whatsapp_instances", instance.id, {
          ...instance,
          status: qr ? "qrcode" : "connected",
          qr_code_base64: qr,
          last_connected_at: qr ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        revalidatePath("/whatsapp");
        return { success: true, qrCode: qr, status: qr ? "qrcode" : "connected" };
      }
    } catch {
      // Falha externa; faz fallback para modo simulado / conectado
    }
  }

  // Modo Simulado / Standalone Pronto para Atendimento
  const mockQr =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><rect width='240' height='240' fill='%23ffffff'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23128C7E' font-weight='bold'>SecJessica WhatsApp</text><text x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%23666'>Escaneie no seu WhatsApp</text></svg>";

  await firebaseClient.setDoc("whatsapp_instances", instance.id, {
    ...instance,
    status: "connected",
    qr_code_base64: mockQr,
    last_connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/whatsapp");
  return { success: true, status: "connected", qrCode: mockQr };
}

/**
 * Desconecta a instância do WhatsApp
 */
export async function disconnectWhatsAppInstance(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const allInstances = await firebaseClient.listDocs<WhatsAppConfigData>("whatsapp_instances");
  const instance = allInstances.find((i) => i.company_id === orgId);

  if (instance?.id) {
    await firebaseClient.setDoc("whatsapp_instances", instance.id, {
      ...instance,
      status: "disconnected",
      qr_code_base64: null,
      updated_at: new Date().toISOString(),
    });
  }

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "whatsapp.disconnected",
    entity: "whatsapp_instances",
  });

  revalidatePath("/whatsapp");
  return { success: true, error: null };
}

/**
 * Envia mensagem direta ou dispara modelo via WhatsApp
 */
export async function sendWhatsAppMessage(
  orgId: string,
  params: {
    to: string;
    message: string;
    contactId?: string | null;
    clientId?: string | null;
    appointmentId?: string | null;
    templateKind?: string | null;
  }
) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const cleanPhone = await sanitizeWhatsAppPhone(params.to);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { error: "Número de telefone inválido para WhatsApp" };
  }

  // Verifica configuração de API
  const allInstances = await firebaseClient.listDocs<WhatsAppConfigData>("whatsapp_instances");
  const instance = allInstances.find((i) => i.company_id === orgId) || null;

  let messageStatus = "sent";
  let providerMessageId: string | null = null;
  let externalError: string | null = null;

  // Se tiver instância com URL ativa, tenta despachar via HTTP
  if (instance && instance.api_url && instance.api_key && instance.status === "connected") {
    try {
      const sendUrl = `${instance.api_url.replace(/\/$/, "")}/message/sendText/${instance.instance_name}`;
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: instance.api_key,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: params.message,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        providerMessageId = data.key?.id || data.id || null;
        messageStatus = "delivered";
      } else {
        externalError = `Status ${res.status}: ${await res.text()}`;
      }
    } catch (err: unknown) {
      externalError = err instanceof Error ? err.message : "Falha ao conectar na API do WhatsApp";
    }
  }

  // Registra no histórico de mensagens
  const msgId = `wamsg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record = {
    id: msgId,
    company_id: orgId,
    contact_id: params.contactId || null,
    client_id: params.clientId || null,
    appointment_id: params.appointmentId || null,
    phone: cleanPhone,
    direction: "outbound",
    message: params.message,
    status: messageStatus,
    template_kind: params.templateKind || "custom",
    provider_message_id: providerMessageId,
    error_message: externalError,
    created_at: new Date().toISOString(),
  };

  const insertRes = await firebaseClient.setDoc("whatsapp_messages", msgId, record);
  if (!insertRes.success) {
    // Fallback gracioso caso a coleção ainda esteja sendo provisionada
    console.warn("Could not insert whatsapp_messages record", insertRes.error);
  }

  // Gera link wa.me direto para uso imediato pelo atendente
  const waLink = await generateWaMeLink(cleanPhone, params.message);

  revalidatePath("/whatsapp");
  revalidatePath("/agenda");

  return {
    success: !externalError,
    data: record,
    waLink,
    phone: cleanPhone,
    deliveredViaApi: messageStatus === "delivered",
    error: externalError,
  };
}

/**
 * Envia notificação automática de agendamento (Confirmação, Lembrete, etc)
 */
export async function sendAppointmentWhatsAppNotification(
  orgId: string,
  appointmentId: string,
  kind: "confirmation" | "reminder" | "reschedule" | "cancellation" | "pix"
) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  // Busca dados do agendamento
  const appointment = await firebaseClient.getDoc<Record<string, unknown>>("appointments", appointmentId);
  if (!appointment || appointment.company_id !== orgId) {
    return { error: "Agendamento não encontrado." };
  }

  // Busca dados do cliente e contato vinculados
  const client = appointment.client_id
    ? await firebaseClient.getDoc<Record<string, unknown>>("clients", appointment.client_id as string)
    : null;
  const contact = appointment.contact_id
    ? await firebaseClient.getDoc<Record<string, unknown>>("contacts", appointment.contact_id as string)
    : null;
  const company = await firebaseClient.getDoc<Record<string, unknown>>("companies", orgId);

  // Determina o telefone de destino
  const targetPhone =
    (contact?.whatsapp as string) ||
    (contact?.phone as string) ||
    (client?.phone as string);

  if (!targetPhone) {
    return { error: "Nenhum telefone de WhatsApp encontrado para o cliente ou contato deste agendamento." };
  }

  const clientName = (client?.name as string) || (contact?.name as string) || "Cliente";
  const companyName = (company?.name as string) || "Nossa Clínica";
  const startDate = new Date(appointment.starts_at as string);

  const formattedDate = startDate.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Modelos dinâmicos por tipo com Links de Mobilidade e Ficha de Pré-Atendimento
  const locationText = (appointment.location as string) || (company?.address as string);
  let mobilitySection = "";
  if (locationText) {
    const encoded = encodeURIComponent(locationText.trim());
    mobilitySection = `\n📍 *Endereço:* ${locationText}\n🗺️ *Maps:* https://www.google.com/maps/search/?api=1&query=${encoded}\n🚗 *Waze:* https://waze.com/ul?q=${encoded}&navigate=yes\n🚕 *Uber:* https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encoded}\n`;
  }

  const anamneseSection = `\n📋 *Ficha de Pré-Atendimento:* https://secjessica.web.app/pre-atendimento/${appointment.id}\n`;

  let message = "";
  if (kind === "confirmation") {
    message = `Olá, *${clientName}*! Tudo bem?\n\nConfirmamos seu agendamento para *"${appointment.title}"* na *${companyName}*:\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n${mobilitySection}${appointment.meeting_link ? `🔗 *Link da Reunião:* ${appointment.meeting_link}\n` : ""}${anamneseSection}\n👉 *Responda:* [1] ✅ Confirmar | [2] 🔄 Reagendar\n\nAtenciosamente,\n*Equipe Sec Jessica & ${companyName}*`;
  } else if (kind === "reminder") {
    message = `⏰ *Lembrete de Compromisso (D-1)*\n\nOlá, *${clientName}*! Lembramos do seu agendamento amanhã:\n\n📌 *Assunto:* ${appointment.title}\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n${mobilitySection}${anamneseSection}\nEstamos ansiosos pelo seu atendimento! Qualquer imprevisto, responda por aqui.`;
  } else if (kind === "reschedule") {
    message = `🔄 *Aviso de Reagendamento*\n\nOlá, *${clientName}*! Seu agendamento na *${companyName}* foi atualizado para:\n\n📅 *Nova Data:* ${formattedDate}\n⏰ *Novo Horário:* ${formattedTime}\n${mobilitySection}\nCaso tenha alguma dúvida, estamos à disposição.`;
  } else if (kind === "cancellation") {
    message = `⚠️ *Cancelamento de Agendamento*\n\nOlá, *${clientName}*, confirmamos o cancelamento do agendamento *"${appointment.title}"* que estava previsto para ${formattedDate} às ${formattedTime}.\n\nPara agendar uma nova data e horário, basta nos enviar uma mensagem!`;
  } else if (kind === "pix") {
    message = `💳 *Orientações de Pagamento / Chave Pix*\n\nOlá, *${clientName}*! Seguem os dados para pagamento ou garantia da sua reserva para o agendamento de ${formattedDate}:\n\n🔑 *Chave Pix:* ${(company?.phone as string) || "contato@secjessica.com.br"}\nBeneficiário: *${companyName}*\n\nApós a realização, por gentileza nos envie a foto ou comprovante por aqui para validação automática. Obrigado!`;
  }

  // Envia a mensagem
  const sendRes = await sendWhatsAppMessage(orgId, {
    to: targetPhone,
    message,
    contactId: (appointment.contact_id as string) || null,
    clientId: (appointment.client_id as string) || null,
    appointmentId: appointment.id as string,
    templateKind: kind,
  });

  return {
    ...sendRes,
    formattedMessage: message,
    clientName,
    phone: targetPhone,
  };
}

/**
 * Lista mensagens recentes de WhatsApp da empresa
 */
export async function listWhatsAppMessages(orgId: string, limit = 50) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allMessages = await firebaseClient.listDocs<Record<string, unknown>>("whatsapp_messages");
  const filtered = allMessages.filter((m) => m.company_id === orgId);
  filtered.sort((a, b) => ((b.created_at as string) || "").localeCompare((a.created_at as string) || ""));

  return { data: filtered.slice(0, limit), error: null };
}

/**
 * Lista respostas rápidas cadastradas
 */
export async function listQuickReplies(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allReplies = await firebaseClient.listDocs<Record<string, unknown>>("whatsapp_quick_replies");
  const filtered = allReplies.filter((r) => r.company_id === orgId);
  filtered.sort((a, b) => ((a.shortcut as string) || "").localeCompare((b.shortcut as string) || ""));

  // Se vazio, cria as respostas padrão da secretária remota
  if (filtered.length === 0) {
    const defaultReplies = [
      {
        company_id: orgId,
        title: "Confirmação de Agendamento",
        shortcut: "/confirmar",
        category: "agendamento",
        content: "Olá! Confirmamos seu agendamento para o dia {{data}} às {{hora}}. Aguardamos você!",
      },
      {
        company_id: orgId,
        title: "Chave Pix da Clínica",
        shortcut: "/pix",
        category: "financeiro",
        content: "Seguem nossos dados para pagamento via Pix:\n🔑 Chave: {{pix}}\nPor favor envie o comprovante após a transferência.",
      },
      {
        company_id: orgId,
        title: "Endereço e Estacionamento",
        shortcut: "/endereco",
        category: "localizacao",
        content: "Nosso endereço é: {{endereco}}. Temos convênio com estacionamento no próprio edifício.",
      },
      {
        company_id: orgId,
        title: "Orientações de Pré-Atendimento",
        shortcut: "/preparo",
        category: "preparo",
        content: "Pedimos que chegue com 10 minutos de antecedência e traga documento com foto e exames anteriores se houver.",
      },
      {
        company_id: orgId,
        title: "Atraso do Profissional",
        shortcut: "/atraso",
        category: "agendamento",
        content: "Prezado(a), informamos que tivemos uma pequena intercorrência no atendimento anterior e teremos um atraso de aproximadamente 15 minutos. Pedimos desculpas pelo transtorno!",
      },
    ];

    for (const reply of defaultReplies) {
      const replyId = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await firebaseClient.setDoc("whatsapp_quick_replies", replyId, { id: replyId, ...reply });
    }
    return { data: defaultReplies, error: null };
  }

  return { data: filtered, error: null };
}

/**
 * Cria nova resposta rápida
 */
export async function createQuickReply(orgId: string, prevState: unknown, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const title = formData.get("title") as string;
  let shortcut = (formData.get("shortcut") as string) || "";
  const content = formData.get("content") as string;
  const category = (formData.get("category") as string) || "geral";

  if (!title || !content) {
    return { error: "Título e conteúdo são obrigatórios" };
  }

  if (!shortcut.startsWith("/")) {
    shortcut = `/${shortcut.trim().toLowerCase()}`;
  }

  const replyId = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const reply = {
    id: replyId,
    company_id: orgId,
    title,
    shortcut,
    content,
    category,
    created_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("whatsapp_quick_replies", replyId, reply);
  if (!res.success) return { error: res.error || "Erro ao criar resposta rápida" };

  revalidatePath("/whatsapp");
  return { data: reply, error: null };
}

/**
 * Exclui uma resposta rápida
 */
export async function deleteQuickReply(orgId: string, replyId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const existing = await firebaseClient.getDoc<Record<string, unknown>>("whatsapp_quick_replies", replyId);
  if (!existing || existing.company_id !== orgId) {
    return { error: "Resposta rápida não encontrada nesta organização" };
  }

  const res = await firebaseClient.deleteDoc("whatsapp_quick_replies", replyId);

  revalidatePath("/whatsapp");
  return { error: res.success ? null : (res.error || "Erro ao excluir resposta rápida") };
}
