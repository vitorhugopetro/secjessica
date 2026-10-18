"use server";

import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";

export async function listMembers(companyId: string) {
  const members = await firebaseClient.listDocs<any>("company_members");
  const filtered = members.filter((m) => m.company_id === companyId);
  filtered.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return filtered;
}

export async function inviteMember(prevState: any, formData: FormData) {
  const companyId = formData.get("company_id") as string;
  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "secretary";

  if (!companyId || !email) return { error: "Empresa e e-mail são obrigatórios" };

  const invitationId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const invitation = {
    id: invitationId,
    company_id: companyId,
    email: email.trim().toLowerCase(),
    role,
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("company_invitations", invitationId, invitation);
  if (!res.success) return { error: res.error || "Erro ao convidar membro" };

  revalidatePath("/usuarios");
  return { error: null };
}
