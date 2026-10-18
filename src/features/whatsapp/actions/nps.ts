"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { sendWhatsAppMessage, sanitizeWhatsAppPhone } from "./index";

export interface NpsSurveyEntry {
  id: string;
  company_id: string;
  appointment_id?: string | null;
  patient_name: string;
  phone: string;
  score?: number | null;
  feedback?: string | null;
  sent_at: string;
  answered_at?: string | null;
  status: "sent" | "answered" | "expired";
}

/**
 * Dispara pesquisa de satisfação NPS pós-atendimento
 */
export async function sendNpsSurvey(
  orgId: string,
  data: {
    appointmentId?: string;
    patientName: string;
    phone: string;
    doctorName?: string;
  }
) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const cleanPhone = await sanitizeWhatsAppPhone(data.phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { error: "Telefone inválido para disparo de NPS" };
  }

  const message = [
    `⭐ *Pesquisa de Satisfação - Sec Jessica*`,
    ``,
    `Olá, *${data.patientName}*! Tudo bem?`,
    `Esperamos que seu atendimento hoje${data.doctorName ? ` com Dr(a) *${data.doctorName}*` : ""} tenha sido excelente!`,
    ``,
    `Em uma escala de *1 a 5*, como você avalia sua experiência?`,
    `1️⃣ - Muito Insatisfeito`,
    `2️⃣ - Insatisfeito`,
    `3️⃣ - Regular`,
    `4️⃣ - Bom`,
    `5️⃣ - Excelente! ⭐⭐⭐⭐⭐`,
    ``,
    `_(Basta responder a este WhatsApp com o número da sua nota)_`,
  ].join("\n");

  const sendRes = await sendWhatsAppMessage(orgId, {
    to: cleanPhone,
    message,
    appointmentId: data.appointmentId,
    templateKind: "nps_survey",
  });

  if (sendRes.success) {
    const surveyId = `nps_${Date.now()}`;
    await firebaseClient.setDoc("nps_surveys", surveyId, {
      company_id: orgId,
      appointment_id: data.appointmentId || null,
      patient_name: data.patientName,
      phone: cleanPhone,
      status: "sent",
      created_at: new Date().toISOString(),
    });
  }

  revalidatePath("/whatsapp");
  return { success: sendRes.success, formattedMessage: message, phone: cleanPhone };
}

/**
 * Registra resposta da pesquisa NPS recebida via Webhook ou manual
 */
export async function recordNpsResponse(
  orgId: string,
  phone: string,
  score: number,
  feedback?: string
) {
  const cleanPhone = await sanitizeWhatsAppPhone(phone);

  // Busca a pesquisa pendente mais recente deste telefone
  const allSurveys = await firebaseClient.listDocs<any>("nps_surveys");
  const survey = allSurveys
    .filter((s: any) => s.company_id === orgId && s.phone === cleanPhone && s.status === "sent")
    .sort((a: any, b: any) => (b.sent_at || "").localeCompare(a.sent_at || ""))[0];

  if (survey) {
    await firebaseClient.setDoc("nps_surveys", survey.id, {
      score,
      feedback: feedback || null,
      answered_at: new Date().toISOString(),
      status: "answered",
    });
  } else {
    await firebaseClient.setDoc("nps_surveys", `nps_${Date.now()}`, {
      company_id: orgId,
      patient_name: "Paciente",
      phone: cleanPhone,
      score,
      feedback: feedback || null,
      answered_at: new Date().toISOString(),
      status: "answered",
    });
  }

  revalidatePath("/whatsapp");
  return { success: true };
}

/**
 * Lista pesquisas NPS e calcula métricas
 */
export async function listNpsSurveys(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], stats: { total: 0, average: 0, promoters: 0 }, error: auth.error };

  const allSurveys = await firebaseClient.listDocs<any>("nps_surveys");
  const surveys = allSurveys.filter((s: any) => s.company_id === orgId);
  surveys.sort((a: any, b: any) => (b.sent_at || "").localeCompare(a.sent_at || ""));

  const answered = surveys.filter((s) => s.score !== null && s.score !== undefined);
  const total = answered.length;
  const sum = answered.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const average = total > 0 ? parseFloat((sum / total).toFixed(1)) : 0;
  const promoters = answered.filter((s) => (s.score || 0) >= 4).length;
  const promoterRate = total > 0 ? Math.round((promoters / total) * 100) : 100;

  return {
    data: surveys,
    stats: {
      total,
      average,
      promoters,
      promoterRate,
    },
    error: null,
  };
}
