"use server";

import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";

export async function createCompany(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name || !slug) return { error: "Nome e slug são obrigatórios" };

  // Verifica se o slug já existe
  const existing = await firebaseClient.queryDocs("companies", { field: "slug", value: slug });
  if (existing && existing.length > 0) {
    return { error: "Slug já está em uso" };
  }

  const companyId = `comp_${Date.now()}`;
  const company = {
    id: companyId,
    name,
    slug,
    email: email || null,
    phone: phone || null,
    address: "",
    timezone: "America/Sao_Paulo",
    segment: "",
    owner_id: "admin-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("companies", companyId, company);
  if (!res.success) return { error: res.error };

  // Vincula o criador como admin da empresa
  await firebaseClient.setDoc("company_members", `${companyId}_admin-user`, {
    id: `${companyId}_admin-user`,
    company_id: companyId,
    user_id: "admin-user",
    role: "admin",
    created_at: new Date().toISOString(),
  });

  revalidatePath("/empresas");
  return { data: company, error: null };
}

export async function updateCompany(id: string, formData: FormData) {
  const name = formData.get("name") as string;

  if (!name) return { error: "Nome é obrigatório" };

  const { error } = await firebaseClient.setDoc("companies", id, {
    name,
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/empresas");
  return { error: error ? String(error) : null };
}

export async function deleteCompany(id: string) {
  const { error } = await firebaseClient.deleteDoc("companies", id);
  revalidatePath("/empresas");
  return { error: error ? String(error) : null };
}
