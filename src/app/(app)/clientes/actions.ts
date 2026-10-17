"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { revalidatePath } from "next/cache";

export async function listClients(companyId: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listClientsByCompany(companyId: string) {
  return await listClients(companyId);
}

export async function createClient(companyId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const cpfCnpj = (formData.get("cpf_cnpj") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name) return { error: "Nome é obrigatório" };

  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_id: companyId,
      name,
      email,
      phone,
      cpf_cnpj: cpfCnpj,
      notes,
      created_by: auth.user!.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await auditLog({
    orgId: companyId,
    userId: auth.user!.id,
    action: "client.created",
    entity: "clients",
    entityId: data?.id,
    metadata: { name },
  });

  revalidatePath("/clientes");
  return { data, error: null };
}

export async function updateClient(id: string, companyId: string, formData: FormData) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const cpfCnpj = (formData.get("cpf_cnpj") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name) return { error: "Nome é obrigatório" };

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      email,
      phone,
      cpf_cnpj: cpfCnpj,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId);

  revalidatePath("/clientes");
  return { error: error?.message ?? null };
}

export async function deleteClient(id: string, companyId: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  await auditLog({
    orgId: companyId,
    userId: auth.user!.id,
    action: "client.deleted",
    entity: "clients",
    entityId: id,
  });

  revalidatePath("/clientes");
  return { error: error?.message ?? null };
}
