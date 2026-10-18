/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";

export async function listReports(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: null, error: auth.error };

  const [appointmentsRes, contactsRes, tasksRes] = await Promise.all([
    firebaseClient.listDocs<any>("appointments"),
    firebaseClient.listDocs<any>("contacts"),
    firebaseClient.listDocs<any>("tasks"),
  ]);

  const appointments = appointmentsRes.filter((a: any) => a.company_id === orgId);
  const contacts = contactsRes.filter((c: any) => c.company_id === orgId);
  const tasks = tasksRes.filter((t: any) => t.company_id === orgId);

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

  const appointmentsRes = await firebaseClient.listDocs<any>("appointments");
  const data = appointmentsRes.filter((a: any) => a.company_id === orgId).sort((a: any, b: any) => (a.starts_at || "").localeCompare(b.starts_at || ""));

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "appointments.exported.csv",
    entity: "appointments",
    metadata: { count: data.length },
  });

  const rows = data.map((a: any) => [
    a.title,
    a.starts_at,
    a.ends_at,
    a.status,
    (a.client?.name || "") || "",
  ]);

  const csv = [
    "Título,Início,Término,Status,Cliente",
    ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return { data: csv, error: null };
}
