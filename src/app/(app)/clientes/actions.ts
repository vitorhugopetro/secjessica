"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";

export interface ClientData {
  id: string;
  company_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cpf_cnpj?: string | null;
  notes?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export async function listClients(companyId: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allClients = await firebaseClient.listDocs<ClientData>("clients");
  const clients = allClients.filter((c) => c.company_id === companyId);
  clients.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return { data: clients, error: null };
}

export async function listClientsByCompany(companyId: string) {
  return await listClients(companyId);
}

export async function createClient(companyId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const cpfCnpj = (formData.get("cpf_cnpj") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name || name.trim().length < 2) return { error: "Nome é obrigatório" };

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newClient: ClientData = {
    id: clientId,
    company_id: companyId,
    name: name.trim(),
    email: email ? email.trim() : null,
    phone: phone ? phone.trim() : null,
    cpf_cnpj: cpfCnpj ? cpfCnpj.trim() : null,
    notes: notes ? notes.trim() : null,
    created_by: auth.user?.id || "admin-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("clients", clientId, newClient);
  if (!res.success) return { error: res.error || "Erro ao salvar cliente no Firestore" };

  await auditLog({
    orgId: companyId,
    userId: auth.user?.id,
    action: "client.created",
    entity: "clients",
    entityId: clientId,
    metadata: { name },
  });

  revalidatePath("/clientes");
  return { data: newClient, error: null };
}

export async function updateClient(id: string, companyId: string, formData: FormData) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const cpfCnpj = (formData.get("cpf_cnpj") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name || name.trim().length < 2) return { error: "Nome é obrigatório" };

  const existing = await firebaseClient.getDoc<ClientData>("clients", id);
  if (!existing || existing.company_id !== companyId) {
    return { error: "Cliente não encontrado nesta organização" };
  }

  const updatedData: ClientData = {
    ...existing,
    name: name.trim(),
    email: email ? email.trim() : null,
    phone: phone ? phone.trim() : null,
    cpf_cnpj: cpfCnpj ? cpfCnpj.trim() : null,
    notes: notes ? notes.trim() : null,
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("clients", id, updatedData);
  if (!res.success) return { error: res.error || "Erro ao atualizar cliente" };

  revalidatePath("/clientes");
  return { error: null };
}

export async function deleteClient(id: string, companyId: string) {
  const auth = await requireOrganization(companyId);
  if (!auth.authorized) return { error: auth.error };

  const existing = await firebaseClient.getDoc<ClientData>("clients", id);
  if (!existing || existing.company_id !== companyId) {
    return { error: "Cliente não encontrado nesta organização" };
  }

  const res = await firebaseClient.deleteDoc("clients", id);
  if (!res.success) return { error: res.error || "Erro ao remover cliente" };

  await auditLog({
    orgId: companyId,
    userId: auth.user?.id,
    action: "client.deleted",
    entity: "clients",
    entityId: id,
  });

  revalidatePath("/clientes");
  return { error: null };
}
