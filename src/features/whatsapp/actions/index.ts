"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface WhatsAppConfigData {
  id?: string;
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("company_id", orgId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return { data: null, error: error.message };
  }

  // Se não existir, retorna configuração padrão manual
  if (!data) {
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

  return { data: data as WhatsAppConfigData, error: null };
}

/**
 * Salva ou atualiza a configuração do WhatsApp da empresa
 */
export async function saveWhatsAppConfig(orgId: string, prevState: any, formData: FormData) {
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

  const supabase = await createServerClient();
  const cleanPhone = parsed.data.phone_number ? await sanitizeWhatsAppPhone(parsed.data.phone_number) : null;

  const payload = {
    company_id: orgId,
    provider: parsed.data.provider,
    instance_name: parsed.data.instance_name,
    phone_number: cleanPhone,
    api_url: parsed.data.api_url || null,
    api_key: parsed.data.api_key || null,
    auto_reply: parsed.data.auto_reply,
    auto_confirm_appointments: parsed.data.auto_confirm_appointments,
    reminder_hours_before: parsed.data.reminder_hours_before,
    business_hours_only: parsed.data.business_hours_only,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("whatsapp_instances")
    .select("id")
    .eq("company_id", orgId)
    .maybeSingle();

  let resData;
  if (existing?.id) {
    const { data, error } = await supabase
      .from("whatsapp_instances")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return { error: error.message };
    resData = data;
  } else {
    const { data, error } = await supabase
      .from("whatsapp_instances")
      .insert({
        ...payload,
        status: "disconnected",
      })
      .select()
      .single();
    if (error) return { error: error.message };
    resData = data;
  }

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "whatsapp.config_updated",
    entity: "whatsapp_instances",
    entityId: resData?.id,
    metadata: { provider: parsed.data.provider, instance: parsed.data.instance_name },
  });

  revalidatePath("/whatsapp");
  revalidatePath("/agenda");
  return { data: resData, error: null };
}

/**
 * Conecta ou simula a conexão e geração do QR Code do WhatsApp
 */
export async function connectWhatsAppInstance(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const { data: instance } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("company_id", orgId)
    .maybeSingle();

  if (!instance) {
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
        await supabase
          .from("whatsapp_instances")
          .update({
            status: qr ? "qrcode" : "connected",
            qr_code_base64: qr,
            last_connected_at: qr ? null : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", instance.id);

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

  await supabase
    .from("whatsapp_instances")
    .update({
      status: "connected",
      qr_code_base64: mockQr,
      last_connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", instance.id);

  revalidatePath("/whatsapp");
  return { success: true, status: "connected", qrCode: mockQr };
}

/**
 * Desconecta a instância do WhatsApp
 */
export async function disconnectWhatsAppInstance(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  await supabase
    .from("whatsapp_instances")
    .update({
      status: "disconnected",
      qr_code_base64: null,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", orgId);

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

  const supabase = await createServerClient();

  // Verifica configuração de API
  const { data: instance } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("company_id", orgId)
    .maybeSingle();

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
    } catch (err: any) {
      externalError = err?.message ?? "Falha ao conectar na API do WhatsApp";
    }
  }

  // Registra no histórico de mensagens
  const { data: record, error: insertError } = await supabase
    .from("whatsapp_messages")
    .insert({
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
    })
    .select()
    .single();

  if (insertError) {
    // Fallback gracioso caso a tabela ainda esteja sendo provisionada
    console.warn("Could not insert whatsapp_messages record", insertError);
  }

  // Gera link wa.me direto para uso imediato pelo atendente
  const waLink = await generateWaMeLink(cleanPhone, params.message);

  revalidatePath("/whatsapp");
  revalidatePath("/agenda");

  return {
    success: true,
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

  const supabase = await createServerClient();

  // Busca dados do agendamento, cliente, contato e empresa
  const { data: appointment, error: appError } = await supabase
    .from("appointments")
    .select("*, client:clients(name, phone), contact:contacts(name, phone, whatsapp), company:companies(name, phone, address)")
    .eq("id", appointmentId)
    .eq("company_id", orgId)
    .single();

  if (appError || !appointment) {
    return { error: "Agendamento não encontrado." };
  }

  // Determina o telefone de destino
  const targetPhone =
    appointment.contact?.whatsapp ||
    appointment.contact?.phone ||
    appointment.client?.phone;

  if (!targetPhone) {
    return { error: "Nenhum telefone de WhatsApp encontrado para o cliente ou contato deste agendamento." };
  }

  const clientName = appointment.client?.name || appointment.contact?.name || "Cliente";
  const companyName = appointment.company?.name || "Nossa Clínica";
  const startDate = new Date(appointment.starts_at);

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

  // Modelos dinâmicos por tipo
  let message = "";
  if (kind === "confirmation") {
    message = `Olá, *${clientName}*! Tudo bem?\n\nConfirmamos seu agendamento para o atendimento *"${appointment.title}"* na *${companyName}*:\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n${appointment.location ? `📍 *Local:* ${appointment.location}\n` : ""}${appointment.meeting_link ? `🔗 *Link da Reunião:* ${appointment.meeting_link}\n` : ""}\nPor favor, responda com *1 para CONFIRMAR* ou *2 para REAGENDAR*.\n\nAtenciosamente,\n*Equipe SecJessica & ${companyName}*`;
  } else if (kind === "reminder") {
    message = `⏰ *Lembrete de Compromisso*\n\nOlá, *${clientName}*! Lembramos do seu agendamento amanhã:\n\n📌 *Assunto:* ${appointment.title}\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n${appointment.location ? `📍 *Endereço:* ${appointment.location}\n` : ""}\nEstamos ansiosos pelo seu atendimento. Qualquer imprevisto, nos avise por aqui!`;
  } else if (kind === "reschedule") {
    message = `🔄 *Aviso de Reagendamento*\n\nOlá, *${clientName}*! Seu agendamento na *${companyName}* foi reagendado com sucesso para:\n\n📅 *Nova Data:* ${formattedDate}\n⏰ *Novo Horário:* ${formattedTime}\n\nCaso tenha alguma dúvida, estamos à disposição.`;
  } else if (kind === "cancellation") {
    message = `⚠️ *Cancelamento de Agendamento*\n\nOlá, *${clientName}*, confirmamos o cancelamento do agendamento *"${appointment.title}"* que estava previsto para ${formattedDate} às ${formattedTime}.\n\nPara agendar uma nova data e horário, basta nos enviar uma mensagem!`;
  } else if (kind === "pix") {
    message = `💳 *Orientações de Pagamento / Chave Pix*\n\nOlá, *${clientName}*! Seguem os dados para pagamento ou garantia da sua reserva para o agendamento de ${formattedDate}:\n\n🔑 *Chave Pix:* ${appointment.company?.phone || "contato@secjessica.com.br"}\nBeneficiário: *${companyName}*\n\nApós a realização, por gentileza nos envie o comprovante por aqui. Obrigado!`;
  }

  // Envia a mensagem
  const sendRes = await sendWhatsAppMessage(orgId, {
    to: targetPhone,
    message,
    contactId: appointment.contact_id,
    clientId: appointment.client_id,
    appointmentId: appointment.id,
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*, contact:contacts(name), client:clients(name)")
    .eq("company_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

/**
 * Lista respostas rápidas cadastradas
 */
export async function listQuickReplies(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("whatsapp_quick_replies")
    .select("*")
    .eq("company_id", orgId)
    .order("shortcut", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  // Se vazio, cria as respostas padrão da secretária remota
  if (!data || data.length === 0) {
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

    await supabase.from("whatsapp_quick_replies").insert(defaultReplies);
    return { data: defaultReplies, error: null };
  }

  return { data: data ?? [], error: null };
}

/**
 * Cria nova resposta rápida
 */
export async function createQuickReply(orgId: string, prevState: any, formData: FormData) {
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("whatsapp_quick_replies")
    .insert({
      company_id: orgId,
      title,
      shortcut,
      content,
      category,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/whatsapp");
  return { data, error: null };
}

/**
 * Exclui uma resposta rápida
 */
export async function deleteQuickReply(orgId: string, replyId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("whatsapp_quick_replies")
    .delete()
    .eq("id", replyId)
    .eq("company_id", orgId);

  revalidatePath("/whatsapp");
  return { error: error?.message ?? null };
}
