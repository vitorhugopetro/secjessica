"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";

export async function listReports(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: null, error: auth.error };

  const supabase = await createServerClient();
  const [appointmentsRes, contactsRes, tasksRes] = await Promise.all([
    supabase.from("appointments").select("id, title, status, starts_at, ends_at, client:clients(name)").eq("company_id", orgId),
    supabase.from("contacts").select("id, name, created_at").eq("company_id", orgId),
    supabase.from("tasks").select("id, title, status, due_at").eq("company_id", orgId),
  ]);

  const appointments = appointmentsRes.data ?? [];
  const contacts = contactsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  return {
    data: {
      appointments,
      contacts,
      tasks,
      summary: {
        totalAppointments: appointments.length,
        confirmedAppointments: appointments.filter((a) => a.status === "confirmed").length,
        cancelledAppointments: appointments.filter((a) => a.status === "cancelled").length,
        totalContacts: contacts.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === "done").length,
        overdueTasks: tasks.filter((t) => t.status === "todo" && t.due_at && new Date(t.due_at) < new Date()).length,
      },
    },
    error: null,
  };
}

export async function exportAppointmentsCSV(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: "", error: auth.error };

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("appointments")
    .select("title, starts_at, ends_at, status, client:clients(name)")
    .eq("company_id", orgId)
    .order("starts_at", { ascending: true });

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "appointments.exported.csv",
    entity: "appointments",
    metadata: { count: (data ?? []).length },
  });

  const rows = (data ?? []).map((a) => [
    a.title,
    a.starts_at,
    a.ends_at,
    a.status,
    (Array.isArray(a.client) ? a.client[0]?.name : (a.client as any)?.name) ?? "",
  ]);

  const csv = [
    "Título,Início,Término,Status,Cliente",
    ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return { data: csv, error: null };
}
