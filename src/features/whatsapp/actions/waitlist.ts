"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { sendWhatsAppMessage, sanitizeWhatsAppPhone } from "./index";

export interface WaitlistEntry {
  id: string;
  company_id: string;
  client_id?: string | null;
  patient_name: string;
  phone: string;
  preferred_shift?: string;
  preferred_days?: string;
  priority: number;
  status: "waiting" | "notified" | "accepted" | "declined" | "expired";
  notified_at?: string | null;
  notes?: string | null;
  created_at: string;
}

/**
 * Adiciona paciente à fila de espera
 */
export async function addToWaitlist(
  orgId: string,
  data: {
    patientName: string;
    phone: string;
    preferredShift?: string;
    preferredDays?: string;
    notes?: string;
    priority?: number;
    clientId?: string;
  }
) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const cleanPhone = await sanitizeWhatsAppPhone(data.phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { error: "Telefone inválido para a fila de espera" };
  }

  const entryId = `waitlist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record: WaitlistEntry = {
    id: entryId,
    company_id: orgId,
    client_id: data.clientId || null,
    patient_name: data.patientName,
    phone: cleanPhone,
    preferred_shift: data.preferredShift || "any",
    preferred_days: data.preferredDays || undefined,
    priority: data.priority || 1,
    notes: data.notes || null,
    status: "waiting",
    created_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("appointment_waitlist", entryId, record);
  if (!res.success) {
    return { error: res.error || "Erro ao adicionar à fila de espera" };
  }

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "whatsapp.waitlist_added",
    entity: "appointment_waitlist",
    entityId: entryId,
    metadata: { patient: data.patientName, phone: cleanPhone },
  });

  revalidatePath("/whatsapp");
  return { success: true, data: record };
}

/**
 * Lista todos os pacientes na fila de espera
 */
export async function listWaitlist(orgId: string): Promise<{ data: WaitlistEntry[]; error?: string | null }> {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allEntries = await firebaseClient.listDocs<WaitlistEntry>("appointment_waitlist");
  const filtered = allEntries.filter((e) => e.company_id === orgId);
  // Sort: priority descending, then created_at ascending
  filtered.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (a.created_at || "").localeCompare(b.created_at || "");
  });

  return { data: filtered, error: null };
}

/**
 * Remove da fila de espera
 */
export async function deleteWaitlistEntry(orgId: string, id: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const existing = await firebaseClient.getDoc<WaitlistEntry>("appointment_waitlist", id);
  if (!existing || existing.company_id !== orgId) {
    return { error: "Entrada não encontrada na fila de espera desta organização" };
  }

  const res = await firebaseClient.deleteDoc("appointment_waitlist", id);
  if (!res.success) return { error: res.error || "Erro ao remover da fila de espera" };

  revalidatePath("/whatsapp");
  return { success: true };
}

/**
 * Notifica paciente da fila de espera sobre vaga/desistência recém-liberada
 */
export async function notifyWaitlistCandidate(
  orgId: string,
  waitlistId: string,
  slotDetails: {
    date: string;
    time: string;
    doctorName?: string;
  }
) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const candidate = await firebaseClient.getDoc<WaitlistEntry>("appointment_waitlist", waitlistId);
  if (!candidate || candidate.company_id !== orgId) {
    return { error: "Candidato não encontrado na fila de espera" };
  }

  const message = [
    `🎉 *Vaga Liberada / Encaixe de Desistência!*`,
    ``,
    `Olá, *${candidate.patient_name}*! Tudo bem?`,
    `Surgiu uma desistência na nossa agenda e abrimos uma vaga para você:`,
    ``,
    `📅 *Data:* ${slotDetails.date}`,
    `⏰ *Horário:* ${slotDetails.time}`,
    slotDetails.doctorName ? `👨‍⚕️ *Profissional:* ${slotDetails.doctorName}` : "",
    ``,
    `Você tem interesse nesse horário?`,
    `👉 Responda com *1 para CONFIRMAR O ENCAIXE* ou *2 para RECUSAR*.`,
    `_(Esta vaga ficará reservada para sua resposta pelos próximos 30 minutos)_`,
  ]
    .filter(Boolean)
    .join("\n");

  const sendRes = await sendWhatsAppMessage(orgId, {
    to: candidate.phone,
    message,
    templateKind: "waitlist_offer",
  });

  if (sendRes.success) {
    await firebaseClient.setDoc("appointment_waitlist", waitlistId, {
      ...candidate,
      status: "notified",
      notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath("/whatsapp");
  return { success: sendRes.success, formattedMessage: message, phone: candidate.phone };
}
