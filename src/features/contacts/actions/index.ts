"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  client_id: z.string().optional().or(z.literal("")),
  role: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  company_name: z.string().optional(),
  type: z.string().optional(),
  origin: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  is_primary: z.boolean().optional(),
});

export async function listContacts(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allContacts = await firebaseClient.listDocs<any>("contacts");
  const contacts = allContacts.filter((c: any) => c.company_id === orgId);
  contacts.sort((a: any, b: any) => (a.created_at || "").localeCompare(b.created_at || ""));

  return { data: contacts, error: null };
}

export async function createContact(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse({
    ...raw,
    is_primary: raw.is_primary === "true" || raw.is_primary === "on",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const contactId = `contact_${Date.now()}`;
  const contact = {
    id: contactId,
    company_id: orgId,
    client_id: parsed.data.client_id || null,
    name: parsed.data.name,
    role: parsed.data.role || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    whatsapp: parsed.data.whatsapp || null,
    company_name: parsed.data.company_name || null,
    type: parsed.data.type || null,
    origin: parsed.data.origin || null,
    status: parsed.data.status || null,
    notes: parsed.data.notes || null,
    is_primary: parsed.data.is_primary ?? false,
    created_by: "admin-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("contacts", contactId, contact);
  if (!res.success) return { error: res.error };

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "contact.created",
    entity: "contacts",
    entityId: contactId,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/contatos");
  return { data: contact, error: null };
}

export async function deleteContact(orgId: string, contactId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const { error } = await firebaseClient.deleteDoc("contacts", contactId, orgId);

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "contact.deleted",
    entity: "contacts",
    entityId: contactId,
  });

  revalidatePath("/contatos");
  return { error: error ? String(error) : null };
}

export async function importContactsCSV(orgId: string, input: any[] | string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  let rows: any[] = [];
  if (typeof input === "string") {
    const lines = input.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length > 1) {
      const headerLine = lines[0];
      const delimiter = headerLine.includes(";") ? ";" : ",";
      const headers = headerLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map((v) => v.replace(/^["']|["']$/g, "").trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          if (h.includes("nome") || h === "name") row.name = values[idx] || "";
          else if (h.includes("mail") || h === "email") row.email = values[idx] || "";
          else if (h.includes("whats") || h === "whatsapp") row.whatsapp = values[idx] || "";
          else if (h.includes("tel") || h.includes("fone") || h === "phone") row.phone = values[idx] || "";
          else if (h.includes("empresa") || h.includes("company")) row.company_name = values[idx] || "";
          else if (h.includes("cargo") || h.includes("fun") || h === "role") row.role = values[idx] || "";
          else if (h.includes("obs") || h.includes("notes")) row.notes = values[idx] || "";
        });
        if (row.name) rows.push(row);
      }
    }
  } else if (Array.isArray(input)) {
    rows = input;
  }

  const inserted: any[] = [];
  for (const row of rows) {
    if (!row.name) continue;
    const contactId = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const contact = {
      id: contactId,
      company_id: orgId,
      name: row.name,
      role: row.role || null,
      email: row.email || null,
      phone: row.phone || null,
      whatsapp: row.whatsapp || null,
      company_name: row.company_name || null,
      notes: row.notes || null,
      created_by: "admin-user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const res = await firebaseClient.setDoc("contacts", contactId, contact);
    if (res.success) inserted.push(contact);
  }

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "contacts.imported",
    entity: "contacts",
    metadata: { count: inserted.length },
  });

  revalidatePath("/contatos");
  return { data: inserted, error: null };
}

export async function exportContactsCSV(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const allContacts = await firebaseClient.listDocs<any>("contacts");
  const contacts = allContacts.filter((c: any) => c.company_id === orgId).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "contacts.exported.csv",
    entity: "contacts",
    metadata: { count: contacts.length },
  });

  const headers = ["Nome", "E-mail", "Telefone", "WhatsApp", "Empresa", "Função", "Observações", "Criado em"];
  const rows = contacts.map((c) => [
    c.name,
    c.email ?? "",
    c.phone ?? "",
    c.whatsapp ?? "",
    c.company_name ?? "",
    c.role ?? "",
    c.notes ?? "",
    c.created_at ?? "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return { data: csv, error: null };
}
