"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCompany(prevState: any, formData: FormData) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name || !slug) return { error: "Nome e slug são obrigatórios" };

  const { data: company, error } = await supabase
    .from("companies")
    .insert({ name, slug, email, phone, owner_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("company_members").insert({
    company_id: company.id,
    user_id: user.id,
    role: "admin",
  });

  revalidatePath("/empresas");
  return { data: company, error: null };
}

export async function updateCompany(id: string, formData: FormData) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Verifica se o usuário é admin da empresa
  const { data: member } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", id)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "admin") {
    return { error: "Acesso negado: apenas administradores podem editar esta empresa" };
  }

  const name = formData.get("name") as string;
  const { error } = await supabase
    .from("companies")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/empresas");
  return { error: error?.message ?? null };
}

export async function deleteCompany(id: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Verifica se o usuário é admin da empresa
  const { data: member } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", id)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "admin") {
    return { error: "Acesso negado: apenas administradores podem excluir esta empresa" };
  }

  const { error } = await supabase.from("companies").delete().eq("id", id);
  revalidatePath("/empresas");
  return { error: error?.message ?? null };
}
