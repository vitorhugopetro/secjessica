"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["baixa", "normal", "alta", "urgente"]).default("normal"),
  status: z.enum(["todo", "in_progress", "waiting", "done", "cancelled"]).default("todo"),
  due_at: z.string().optional(),
  contact_id: z.string().optional(),
  appointment_id: z.string().optional(),
  assigned_to: z.string().optional(),
});

export async function listTasks(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allTasks = await firebaseClient.listDocs<any>("tasks");
  const tasks = allTasks.filter((t: any) => t.company_id === orgId);
  tasks.sort((a: any, b: any) => (a.due_at || "").localeCompare(b.due_at || ""));

  return { data: tasks, error: null };
}

export async function createTask(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const taskId = `task_${Date.now()}`;
  const task = {
    id: taskId,
    company_id: orgId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    priority: parsed.data.priority,
    status: parsed.data.status,
    due_at: parsed.data.due_at ? new Date(parsed.data.due_at).toISOString() : null,
    contact_id: parsed.data.contact_id || null,
    appointment_id: parsed.data.appointment_id || null,
    assigned_to: parsed.data.assigned_to || null,
    created_by: "admin-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("tasks", taskId, task);
  if (!res.success) return { error: res.error };

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "task.created",
    entity: "tasks",
    entityId: taskId,
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/tarefas");
  return { data: task, error: null };
}

export async function updateTaskStatus(taskId: string, companyId: string, status: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "done") updates.completed_at = new Date().toISOString();

  const { error } = await firebaseClient.setDoc("tasks", taskId, updates);
  revalidatePath("/tarefas");
  return { error: error ? String(error) : null };
}

export async function deleteTask(taskId: string, companyId: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const { error } = await firebaseClient.deleteDoc("tasks", taskId);

  await auditLog({
    orgId: companyId,
    userId: "admin-user",
    action: "task.deleted",
    entity: "tasks",
    entityId: taskId,
  });

  revalidatePath("/tarefas");
  return { error: error ? String(error) : null };
}

export async function listOverdueTasks(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allTasks = await firebaseClient.listDocs<any>("tasks");
  const now = new Date();
  const overdue = allTasks.filter((t: any) => t.company_id === orgId && t.status !== "done" && t.status !== "cancelled" && t.due_at && new Date(t.due_at) < now);
  overdue.sort((a: any, b: any) => (a.due_at || "").localeCompare(b.due_at || ""));

  return { data: overdue, error: null };
}
