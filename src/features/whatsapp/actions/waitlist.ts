"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";
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

  const supabase = await createServerClient();
  const { data: record, error } = await supabase
    .from("appointment_waitlist")
    .insert({
      company_id: orgId,
      client_id: data.clientId || null,
      patient_name: data.patientName,
      phone: cleanPhone,
      preferred_shift: data.preferredShift || "any",
      preferred_days: data.preferredDays || null,
      priority: data.priority || 1,
      notes: data.notes || null,
      status: "waiting",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "whatsapp.waitlist_added",
    entity: "appointment_waitlist",
    entityId: record?.id,
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("appointment_waitlist")
    .select("*")
    .eq("company_id", orgId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data as WaitlistEntry[]) || [], error: null };
}

/**
 * Remove da fila de espera
 */
export async function deleteWaitlistEntry(orgId: string, id: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("appointment_waitlist")
    .delete()
    .eq("id", id)
    .eq("company_id", orgId);

  if (error) return { error: error.message };

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

  const supabase = await createServerClient();
  const { data: candidate, error } = await supabase
    .from("appointment_waitlist")
    .select("*")
    .eq("id", waitlistId)
    .eq("company_id", orgId)
    .single();

  if (error || !candidate) {
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
    await supabase
      .from("appointment_waitlist")
      .update({
        status: "notified",
        notified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", waitlistId);
  }

  revalidatePath("/whatsapp");
  return { success: sendRes.success, formattedMessage: message, phone: candidate.phone };
}
