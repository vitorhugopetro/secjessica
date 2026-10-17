import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint de verificação para Meta Cloud API / Webhook Check
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Se for verificação da Meta Cloud API
  if (mode === "subscribe" && challenge) {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "secjessica_verify_token";
    if (token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Token de verificação inválido", { status: 403 });
  }

  // Healthcheck para Evolution API / Z-API
  return NextResponse.json({
    status: "online",
    service: "SecJessica WhatsApp Webhook Gateway",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Processamento de Webhooks Recebidos (Evolution API, Z-API, Meta Cloud API)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get("company_id");

    const supabase = (await createServerClient()) as any;

    // Extrai informações da mensagem de acordo com o provedor
    let instanceName: string | null = null;
    let senderPhone: string | null = null;
    let messageText: string | null = null;
    let providerMessageId: string | null = null;
    let eventType: string = "message";

    // 1. Identificação do formato Evolution API
    if (body.event === "messages.upsert" || body.data?.message) {
      instanceName = body.instance || null;
      const msg = body.data?.message || body.data;
      senderPhone = body.data?.key?.remoteJid?.split("@")[0] || null;
      messageText =
        msg?.conversation ||
        msg?.extendedTextMessage?.text ||
        msg?.imageMessage?.caption ||
        null;
      providerMessageId = body.data?.key?.id || null;
      eventType = body.event || "message";
    }
    // 2. Identificação do formato Z-API
    else if (body.phone && (body.text || body.messageId)) {
      senderPhone = body.phone;
      messageText = body.text?.message || body.message || null;
      providerMessageId = body.messageId || null;
      instanceName = body.instanceId || null;
    }
    // 3. Formato Genérico / SecJessica Fallback
    else {
      senderPhone = body.phone || body.from || body.sender || null;
      messageText = body.message || body.text || body.body || null;
      providerMessageId = body.id || body.message_id || null;
      instanceName = body.instance || body.instance_name || null;
    }

    if (!senderPhone || !messageText) {
      // Pode ser evento de status ou digitação
      return NextResponse.json({ received: true, ignored: "No text or sender found" });
    }

    // Normaliza telefone
    const cleanPhone = senderPhone.replace(/\D/g, "");

    // Identifica a empresa dona da instância
    let companyId = queryCompanyId;
    if (!companyId && instanceName) {
      const { data: inst } = await supabase
        .from("whatsapp_instances")
        .select("company_id")
        .eq("instance_name", instanceName)
        .maybeSingle();

      if (inst?.company_id) {
        companyId = inst.company_id;
      }
    }

    // Se ainda não identificou, busca por telefone cadastrado em empresas
    if (!companyId) {
      const { data: fallbackInst } = await supabase
        .from("whatsapp_instances")
        .select("company_id")
        .limit(1)
        .maybeSingle();
      companyId = fallbackInst?.company_id || null;
    }

    if (!companyId) {
      return NextResponse.json({ received: true, error: "Company not resolved" });
    }

    // Localiza contato ou cliente associado ao telefone
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, client_id, name")
      .eq("company_id", companyId)
      .or(`phone.ilike.%${cleanPhone.slice(-8)}%,whatsapp.ilike.%${cleanPhone.slice(-8)}%`)
      .limit(1)
      .maybeSingle();

    let clientId = contact?.client_id || null;
    if (!clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("id, name")
        .eq("company_id", companyId)
        .ilike("phone", `%${cleanPhone.slice(-8)}%`)
        .limit(1)
        .maybeSingle();
      if (client) clientId = client.id;
    }

    // Verifica se há agendamento recente para este cliente/contato
    let appointmentId: string | null = null;
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const next7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: latestApp } = await supabase
      .from("appointments")
      .select("id, title, status, starts_at")
      .eq("company_id", companyId)
      .gte("starts_at", past24h)
      .lte("starts_at", next7d)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (latestApp) {
      appointmentId = latestApp.id;
    }

    // Salva mensagem recebida no histórico
    const { data: insertedMsg, error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        company_id: companyId,
        contact_id: contact?.id || null,
        client_id: clientId || null,
        appointment_id: appointmentId,
        phone: cleanPhone,
        direction: "inbound",
        message: messageText,
        status: "received",
        template_kind: "inbound",
        provider_message_id: providerMessageId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[WhatsApp Webhook] Error inserting message:", insertError);
    }

    // Lógica Inteligente de Resposta Automática / Triagem da Secretária Jéssica
    const trimmed = messageText.trim().toLowerCase();

    // 1. Resposta com confirmação ("1", "sim", "confirmo", "confirmado")
    if ((trimmed === "1" || trimmed === "sim" || trimmed === "confirmo" || trimmed === "confirmado") && appointmentId) {
      // Atualiza status do agendamento para confirmado
      await supabase
        .from("appointments")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

      // Cria notificação interna para a secretária
      await supabase.from("notifications").insert({
        company_id: companyId,
        title: "Agendamento Confirmado via WhatsApp",
        message: `Cliente ${contact?.name || cleanPhone} confirmou o agendamento via resposta no WhatsApp.`,
        type: "appointment_confirmed",
        read: false,
      });
    }
    // 2. Resposta de reagendamento ("2", "reagendar", "mudar horário", "cancelar")
    else if (trimmed === "2" || trimmed.includes("reagendar") || trimmed.includes("mudar horário")) {
      // Cria tarefa urgente para a secretária entrar em contato
      await supabase.from("tasks").insert({
        company_id: companyId,
        title: `Reagendamento solicitado: ${contact?.name || cleanPhone}`,
        description: `O cliente respondeu ao lembrete de WhatsApp solicitando reagendamento. Mensagem: "${messageText}"`,
        priority: "high",
        status: "pending",
        due_date: new Date().toISOString(),
      });

      await supabase.from("notifications").insert({
        company_id: companyId,
        title: "Solicitação de Reagendamento no WhatsApp",
        message: `${contact?.name || cleanPhone} solicitou alteração de data/horário. Tarefa prioritária criada.`,
        type: "reschedule_requested",
        read: false,
      });
    }

    return NextResponse.json({
      success: true,
      receivedMessageId: insertedMsg?.id || null,
      autoHandled: trimmed === "1" || trimmed === "2",
    });
  } catch (err: any) {
    console.error("[WhatsApp Webhook Error]", err);
    return NextResponse.json(
      { error: "Webhook processing failed", details: err?.message },
      { status: 500 }
    );
  }
}
