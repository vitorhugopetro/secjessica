"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, contact:contacts(name)")
    .eq("company_id", orgId)
    .order("due_at", { ascending: true });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function createTask(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createServerClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
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
      created_by: auth.user!.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "task.created",
    entity: "tasks",
    entityId: task?.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/tarefas");
  return { data: task, error: null };
}

export async function updateTaskStatus(taskId: string, companyId: string, status: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "done") updates.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("company_id", companyId);

  revalidatePath("/tarefas");
  return { error: error?.message ?? null };
}

export async function deleteTask(taskId: string, companyId: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("company_id", companyId);

  await auditLog({
    orgId: companyId,
    userId: auth.user!.id,
    action: "task.deleted",
    entity: "tasks",
    entityId: taskId,
  });

  revalidatePath("/tarefas");
  return { error: error?.message ?? null };
}

export async function listOverdueTasks(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("company_id", orgId)
    .neq("status", "done")
    .neq("status", "cancelled")
    .lt("due_at", now)
    .order("due_at", { ascending: true });

  return { data: data ?? [], error: error?.message ?? null };
}
