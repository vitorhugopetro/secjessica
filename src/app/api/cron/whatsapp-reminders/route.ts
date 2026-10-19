/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendAppointmentWhatsAppNotification } from "@/features/whatsapp/actions";

export const dynamic = "force-dynamic";

/**
 * Cron Job para Disparo Automático de Lembretes D-1 (24 horas antes da consulta)
 * Pode ser agendado no n8n, Vercel Cron, Cloud Scheduler ou executado manualmente
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "secjessica_cron_secret";

    // Verificação de segurança opcional
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Acesso não autorizado para execução do cron" }, { status: 401 });
      }
    }

    const supabase = await createServerClient();

    // Calcula a janela do dia seguinte (D-1) no fuso de Brasília (UTC-3)
    const now = new Date();
    const spOffset = -3 * 60; // minutos de offset para America/Sao_Paulo (UTC-3)
    const spLocalMs = now.getTime() + spOffset * 60 * 1000;
    const spDate = new Date(spLocalMs);

    const tomorrowStart = new Date(spDate);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setUTCHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(spDate);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setUTCHours(23, 59, 59, 999);

    // Busca agendamentos do dia seguinte que não estejam cancelados
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, company_id, title, starts_at, status")
      .gte("starts_at", tomorrowStart.toISOString())
      .lte("starts_at", tomorrowEnd.toISOString())
      .neq("status", "cancelled");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = [];
    for (const app of appointments || []) {
      try {
        const sendRes: any = await sendAppointmentWhatsAppNotification(
          app.company_id,
          app.id,
          "reminder"
        );
        results.push({
          appointmentId: app.id,
          companyId: app.company_id,
          success: Boolean(sendRes && sendRes.success),
          phone: sendRes?.phone || null,
        });
      } catch (err: any) {
        results.push({
          appointmentId: app.id,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      executionTime: new Date().toISOString(),
      targetDate: tomorrowStart.toISOString().split("T")[0],
      totalAppointmentsFound: (appointments || []).length,
      dispatchedReminders: results.filter((r) => r.success).length,
      details: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no processamento do cron de lembretes" }, { status: 500 });
  }
}
