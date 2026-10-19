/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parsePixReceiptText } from "@/features/whatsapp/lib/pix-ocr";
import { isWithinBusinessHours } from "@/features/whatsapp/lib/business-hours";
import { recordNpsResponse } from "@/features/whatsapp/actions/nps";
import { processPixReceipt } from "@/features/whatsapp/actions/pix";
import { sendWhatsAppMessage } from "@/features/whatsapp/actions";

export const dynamic = "force-dynamic";

/**
 * Endpoint de verificação para Meta Cloud API / Webhook Check
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge) {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "secjessica_verify_token";
    if (token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Token de verificação inválido", { status: 403 });
  }

  return NextResponse.json({
    status: "online",
    service: "SecJessica WhatsApp Webhook Gateway",
    features: [
      "interactive_buttons",
      "nps_auto_scoring",
      "pix_ocr_parser",
      "waitlist_auto_handling",
      "business_hours_guard",
    ],
    timestamp: new Date().toISOString(),
  });
}

/**
 * Processamento de Webhooks Recebidos (Evolution API, Z-API, Meta Cloud API)
 */
export async function POST(request: NextRequest) {
  try {
    // Validação de assinatura do webhook (segurança)
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (webhookSecret && process.env.NODE_ENV === "production") {
      const provided = request.headers.get("x-webhook-secret") || "";
      if (!provided || provided !== webhookSecret) {
        return NextResponse.json({ error: "Webhook secret inválido" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get("company_id");

    const supabase = (await createServerClient()) as any;

    let instanceName: string | null = null;
    let senderPhone: string | null = null;
    let messageText: string | null = null;
    let buttonId: string | null = null;
    let providerMessageId: string | null = null;
    let imageUrl: string | null = null;

    // 1. Identificação do formato Evolution API
    if (body.event === "messages.upsert" || body.data?.message) {
      instanceName = body.instance || null;
      const msg = body.data?.message || body.data;
      senderPhone = body.data?.key?.remoteJid?.split("@")[0] || null;

      // Suporte a texto direto, resposta interativa ou legenda de imagem
      messageText =
        msg?.conversation ||
        msg?.extendedTextMessage?.text ||
        msg?.imageMessage?.caption ||
        msg?.buttonsResponseMessage?.selectedButtonId ||
        msg?.templateButtonReplyMessage?.selectedId ||
        null;

      buttonId =
        msg?.buttonsResponseMessage?.selectedButtonId ||
        msg?.templateButtonReplyMessage?.selectedId ||
        null;

      if (msg?.imageMessage?.url) {
        imageUrl = msg.imageMessage.url;
      }

      providerMessageId = body.data?.key?.id || null;
    }
    // 2. Identificação do formato Z-API
    else if (body.phone && (body.text || body.messageId || body.buttonResponse)) {
      senderPhone = body.phone;
      messageText = body.text?.message || body.message || body.buttonResponse?.buttonId || null;
      buttonId = body.buttonResponse?.buttonId || null;
      providerMessageId = body.messageId || null;
      instanceName = body.instanceId || null;
    }
    // 3. Formato Genérico / Meta Cloud API
    else {
      senderPhone = body.phone || body.from || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || null;
      const metaMsg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (metaMsg) {
        messageText = metaMsg.text?.body || metaMsg.interactive?.button_reply?.title || metaMsg.interactive?.button_reply?.id || null;
        buttonId = metaMsg.interactive?.button_reply?.id || null;
        providerMessageId = metaMsg.id || null;
      } else {
        messageText = body.message || body.text || body.body || null;
        providerMessageId = body.id || body.message_id || null;
        instanceName = body.instance || body.instance_name || null;
      }
    }

    if (!senderPhone || (!messageText && !imageUrl)) {
      return NextResponse.json({ received: true, ignored: "No text, button or image" });
    }

    const cleanPhone = senderPhone.replace(/\D/g, "");

    // Identifica a empresa dona da instância
    let companyId = queryCompanyId;
    if (!companyId && instanceName) {
      const { data: inst } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("instance_name", instanceName)
        .maybeSingle();

      if (inst?.company_id) companyId = inst.company_id;
    }

    if (!companyId) {
      // Não fazer fallback automático para empresa aleatória: rejeita se não identificou a empresa
      return NextResponse.json({ error: "Empresa não identificada para esta instância" }, { status: 400 });
    }

    const orgId: string = companyId || "default";

    // Busca configurações da instância (para verificar horário de atendimento e recursos)
    const { data: instanceConfig } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("company_id", orgId)
      .maybeSingle();

    // Localiza contato ou cliente associado
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

    // Busca agendamento recente deste paciente
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

    if (latestApp) appointmentId = latestApp.id;

    // Salva mensagem recebida no histórico
    const { data: insertedMsg } = await supabase
      .from("whatsapp_messages")
      .insert({
        company_id: companyId,
        contact_id: contact?.id || null,
        client_id: clientId || null,
        appointment_id: appointmentId,
        phone: cleanPhone,
        direction: "inbound",
        message: messageText || "[Imagem / Comprovante]",
        status: "received",
        template_kind: buttonId ? "button_reply" : "inbound",
        provider_message_id: providerMessageId,
      })
      .select()
      .single();

    const trimmed = (messageText || "").trim().toLowerCase();

    // -------------------------------------------------------------
    // 1. RECONHECIMENTO DE COMPROVANTE PIX (OCR / Heurística)
    // -------------------------------------------------------------
    const pixAnalysis = parsePixReceiptText(messageText || "");
    if (pixAnalysis.isPixReceipt || trimmed.includes("comprovante")) {
      await processPixReceipt(orgId, {
        senderPhone: cleanPhone,
        rawText: messageText || "Comprovante enviado em anexo",
        imageUrl: imageUrl || undefined,
        appointmentId: appointmentId || undefined,
      });

      // Resposta imediata cordial
      await sendWhatsAppMessage(orgId, {
        to: cleanPhone,
        message: `✅ *Comprovante Pix recebido!* Nossa equipe financeira já foi notificada para conferência. Agradecemos o envio!`,
      });
    }

    // -------------------------------------------------------------
    // 2. RECONHECIMENTO DE BOTÕES OU RESPOSTAS DE CONFIRMAÇÃO
    // -------------------------------------------------------------
    const isConfirm = buttonId === "btn_confirm" || trimmed === "1" || trimmed === "sim" || trimmed === "confirmo" || trimmed === "confirmado";
    const isReschedule = buttonId === "btn_reschedule" || trimmed === "2" || trimmed.includes("reagendar") || trimmed.includes("mudar horário");
    const isCancel = buttonId === "btn_cancel" || trimmed.includes("cancelar consulta");
    const isAcceptWaitlist = buttonId === "btn_accept_encaixe" || trimmed === "1" || trimmed.includes("quero o encaixe");

    if (isConfirm && appointmentId) {
      await supabase
        .from("appointments")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

      // Envia confirmação com link do pré-atendimento (Anamnese)
      const anamneseLink = `https://secjessica.web.app/pre-atendimento/${appointmentId}`;
      await sendWhatsAppMessage(orgId, {
        to: cleanPhone,
        message: `🎉 *Agendamento Confirmado com Sucesso!*\n\nPara agilizar sua consulta, preencha sua *Ficha de Pré-Atendimento* em menos de 1 minuto pelo link seguro:\n👉 ${anamneseLink}\n\nAté breve!`,
      });

      await supabase.from("notifications").insert({
        company_id: orgId,
        title: "Agendamento Confirmado via WhatsApp",
        body: `Cliente ${contact?.name || cleanPhone} confirmou o agendamento via WhatsApp.`,
        kind: "appointment_confirmed",
        read: false,
      });
    } else if (isReschedule || isCancel) {
      await supabase.from("tasks").insert({
        company_id: orgId,
        title: `Reagendamento/Cancelamento: ${contact?.name || cleanPhone}`,
        description: `O cliente respondeu ao WhatsApp solicitando alteração. Mensagem: "${messageText}"`,
        priority: "high",
        status: "pending",
        due_at: new Date().toISOString(),
      });

      await sendWhatsAppMessage(orgId, {
        to: cleanPhone,
        message: `Anotado! A secretária Jéssica entrará em contato em breve para apresentar os novos dias e horários disponíveis.`,
      });
    }

    // -------------------------------------------------------------
    // 3. PESQUISA NPS (NOTAS DE 1 A 5)
    // -------------------------------------------------------------
    if (/^[1-5]$/.test(trimmed)) {
      const score = parseInt(trimmed, 10);
      await recordNpsResponse(orgId, cleanPhone, score);

      await sendWhatsAppMessage(orgId, {
        to: cleanPhone,
        message: `Muito obrigado pela sua avaliação (${score}/5 ⭐)! Sua opinião é fundamental para aprimorarmos continuamente nosso atendimento.`,
      });
    }

    // -------------------------------------------------------------
    // 4. RESPOSTA DE AUSÊNCIA NOTURNA / FIM DE SEMANA
    // -------------------------------------------------------------
    if (instanceConfig?.business_hours_only) {
      const businessCheck = isWithinBusinessHours({
        enabled: true,
        startTime: instanceConfig.business_hours_start || "08:00",
        endTime: instanceConfig.business_hours_end || "18:00",
        workDays: instanceConfig.business_days || [1, 2, 3, 4, 5],
      });

      if (!businessCheck.isWithin) {
        const outMessage =
          instanceConfig.out_of_hours_message ||
          "Olá! Agradecemos seu contato. Nosso atendimento funciona de segunda a sexta das 08h às 18h. Retornaremos sua mensagem pontualmente no próximo horário útil.";

        await sendWhatsAppMessage(orgId, {
          to: cleanPhone,
          message: outMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      receivedMessageId: insertedMsg?.id || null,
      autoHandled: isConfirm || isReschedule || pixAnalysis.isPixReceipt,
    });
  } catch (err: any) {
    console.error("[WhatsApp Webhook Error]", err);
    return NextResponse.json({ error: "Webhook processing failed", details: err?.message }, { status: 500 });
  }
}
