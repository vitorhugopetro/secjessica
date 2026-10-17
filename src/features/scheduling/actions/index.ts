"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, client:clients(name), contact:contacts(name)")
    .eq("company_id", orgId)
    .order("starts_at", { ascending: true });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function createAppointment(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = appointmentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const starts = new Date(parsed.data.starts_at).toISOString();
  const ends = new Date(parsed.data.ends_at).toISOString();
  if (ends <= starts) return { error: "O término deve ser após o início" };

  const supabase = await createServerClient();

  // Verificação de conflito no servidor
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at")
    .eq("company_id", orgId)
    .neq("status", "cancelled")
    .lt("starts_at", ends)
    .gt("ends_at", starts);

  if (conflicts && conflicts.length > 0) {
    return { error: "Conflito de horário: já existe um compromisso agendado neste período." };
  }

  const { data: app, error } = await supabase
    .from("appointments")
    .insert({
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
      created_by: auth.user!.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "appointment.created",
    entity: "appointments",
    entityId: app?.id,
    metadata: { title: parsed.data.title, starts_at: starts },
  });

  revalidatePath("/agenda");
  return { data: app, error: null };
}

export async function deleteAppointment(orgId: string, appointmentId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("company_id", orgId);

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "appointment.deleted",
    entity: "appointments",
    entityId: appointmentId,
  });

  revalidatePath("/agenda");
  return { error: error?.message ?? null };
}
