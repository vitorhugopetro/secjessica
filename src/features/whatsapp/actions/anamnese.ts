"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PreAnamneseData {
  id?: string;
  company_id?: string;
  appointment_id: string;
  patient_name: string;
  phone: string;
  birth_date?: string;
  cpf?: string;
  chief_complaint?: string;
  allergies?: string;
  chronic_diseases?: string;
  current_medications?: string;
  emergency_contact?: string;
  filled_at?: string;
}

/**
 * Submissão pública do formulário de pré-atendimento pelo paciente
 */
export async function submitPreAnamnese(data: PreAnamneseData) {
  if (!data.appointment_id || !data.patient_name || !data.phone) {
    return { error: "Nome, telefone e ID do agendamento são obrigatórios." };
  }

  const supabase = await createServerClient();

  // Busca a empresa dona do agendamento
  const { data: app } = await supabase
    .from("appointments")
    .select("company_id")
    .eq("id", data.appointment_id)
    .maybeSingle();

  const companyId = app?.company_id || "default";

  const { data: record, error } = await supabase
    .from("pre_anamnese_forms")
    .insert({
      company_id: companyId,
      appointment_id: data.appointment_id,
      patient_name: data.patient_name,
      phone: data.phone,
      birth_date: data.birth_date || null,
      cpf: data.cpf || null,
      chief_complaint: data.chief_complaint || null,
      allergies: data.allergies || null,
      chronic_diseases: data.chronic_diseases || null,
      current_medications: data.current_medications || null,
      emergency_contact: data.emergency_contact || null,
      status: "completed",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, data: record };
}

/**
 * Busca a anamnese preenchida de um agendamento
 */
export async function getPreAnamneseByAppointment(orgId: string, appointmentId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: null, error: auth.error };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pre_anamnese_forms")
    .select("*")
    .eq("company_id", orgId)
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Lista todas as anamneses recebidas da empresa
 */
export async function listPreAnamneses(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pre_anamnese_forms")
    .select("*")
    .eq("company_id", orgId)
    .order("filled_at", { ascending: false })
    .limit(50);

  if (error) return { data: [], error: error.message };
  return { data: data || [], error: null };
}
