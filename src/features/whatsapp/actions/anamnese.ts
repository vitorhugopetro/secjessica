/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { requireOrganization } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";

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

  // Busca a empresa dona do agendamento
  const app = await firebaseClient.getDoc<any>("appointments", data.appointment_id);
  const companyId = app?.company_id || "default";

  const formId = `anamnese_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record: PreAnamneseData = {
    id: formId,
    company_id: companyId,
    appointment_id: data.appointment_id,
    patient_name: data.patient_name.trim(),
    phone: data.phone.trim(),
    birth_date: data.birth_date || undefined,
    cpf: data.cpf || undefined,
    chief_complaint: data.chief_complaint || undefined,
    allergies: data.allergies || undefined,
    chronic_diseases: data.chronic_diseases || undefined,
    current_medications: data.current_medications || undefined,
    emergency_contact: data.emergency_contact || undefined,
    filled_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("pre_anamnese_forms", formId, record);
  if (!res.success) {
    return { error: res.error || "Erro ao salvar pré-anamnese no Firestore" };
  }

  return { success: true, data: record };
}

/**
 * Busca a anamnese preenchida de um agendamento
 */
export async function getPreAnamneseByAppointment(orgId: string, appointmentId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: null, error: auth.error };

  const forms = await firebaseClient.listDocs<PreAnamneseData>("pre_anamnese_forms");
  const found = forms.find(
    (f) => f.company_id === orgId && f.appointment_id === appointmentId
  ) || null;

  return { data: found, error: null };
}

/**
 * Lista todas as anamneses recebidas da empresa
 */
export async function listPreAnamneses(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const forms = await firebaseClient.listDocs<PreAnamneseData>("pre_anamnese_forms");
  const filtered = forms.filter((f) => f.company_id === orgId);
  filtered.sort((a, b) => (b.filled_at || "").localeCompare(a.filled_at || ""));

  return { data: filtered.slice(0, 50), error: null };
}
