"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function listMembers(companyId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("company_members")
    .select("*, profile:profiles(full_name, email)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function inviteMember(prevState: any, formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const companyId = formData.get("company_id") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string || "secretary";

  if (!companyId || !email) return { error: "Empresa e e-mail são obrigatórios" };

  const { error } = await supabase.from("company_invitations").insert({
    company_id: companyId,
    email,
    role,
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: user.id,
  });

  revalidatePath("/usuarios");
  return { error: error?.message ?? null };
}
