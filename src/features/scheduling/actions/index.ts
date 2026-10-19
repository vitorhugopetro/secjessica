/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const appointmentSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  client_id: z.string().optional().or(z.literal("")),
  contact_id: z.string().optional().or(z.literal("")),
  professional_id: z.string().optional().or(z.literal("")),
  service_id: z.string().optional().or(z.literal("")),
  starts_at: z.string().min(1, "Início é obrigatório"),
  ends_at: z.string().min(1, "Término é obrigatório"),
  status: z.string().default("scheduled"),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
});

export async function listAppointments(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allApps = await firebaseClient.listDocs<any>("appointments");
  const appointments = allApps.filter((a: any) => a.company_id === orgId);
  appointments.sort((a: any, b: any) => (a.starts_at || "").localeCompare(b.starts_at || ""));

  return { data: appointments, error: null };
}

export async function createAppointment(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = appointmentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const toISO = (s: string) => {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    // Se a string não traz fuso, interpreta como horário de Brasília (UTC-3)
    if (/[Zz]|[+-]\d{2}:?\d{2}$/.test(s.trim())) return d.toISOString();
    const spOffsetMs = -3 * 60 * 60 * 1000;
    return new Date(d.getTime() + spOffsetMs).toISOString();
  };

  const starts = toISO(parsed.data.starts_at);
  const ends = toISO(parsed.data.ends_at);
  if (ends <= starts) return { error: "O término deve ser após o início" };

  const supabase = null; // Usando Firebase

  // Verificação de conflito no servidor
  const allApps = await firebaseClient.listDocs<any>("appointments");
  const conflicts = allApps.filter((a: any) => a.company_id === orgId && a.status !== "cancelled" &&
    new Date(a.starts_at) < new Date(ends) && new Date(a.ends_at) > new Date(starts));

  if (conflicts && conflicts.length > 0) {
    return { error: "Conflito de horário: já existe um compromisso agendado neste período." };
  }

  const appointmentId = `appointment_${Date.now()}`;
  const appointment = {
    id: appointmentId,
    company_id: orgId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    client_id: parsed.data.client_id || null,
    contact_id: parsed.data.contact_id || null,
    professional_id: parsed.data.professional_id || null,
    service_id: parsed.data.service_id || null,
    starts_at: starts,
    ends_at: ends,
    status: parsed.data.status,
    location: parsed.data.location || null,
    meeting_link: parsed.data.meeting_link || null,
    created_by: "admin-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("appointments", appointmentId, appointment);
  if (!res.success) return { error: res.error };

  // Revalidação pós-gravação para mitigar race condition (TOCTOU):
  // se outro appointment conflitante apareceu entre a leitura e a gravação,
  // desfaz esta gravação e retorna erro.
  const allAppsAfter = await firebaseClient.listDocs<any>("appointments");
  const conflictAfter = allAppsAfter.find((a: any) =>
    a.id !== appointmentId &&
    a.company_id === orgId &&
    a.status !== "cancelled" &&
    new Date(a.starts_at) < new Date(ends) &&
    new Date(a.ends_at) > new Date(starts)
  );

  if (conflictAfter) {
    await firebaseClient.deleteDoc("appointments", appointmentId);
    return { error: "Conflito de horário: já existe um compromisso agendado neste período." };
  }

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "appointment.created",
    entity: "appointments",
    entityId: appointmentId,
    metadata: { title: parsed.data.title, starts_at: starts },
  });

  revalidatePath("/agenda");
  return { data: appointment, error: null };
}

export async function deleteAppointment(orgId: string, appointmentId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const { error } = await firebaseClient.deleteDoc("appointments", appointmentId);

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "appointment.deleted",
    entity: "appointments",
    entityId: appointmentId,
  });

  revalidatePath("/agenda");
  return { error: error ? String(error) : null };
}
