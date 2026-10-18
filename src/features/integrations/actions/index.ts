"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  kind: z.string().min(1, "Tipo é obrigatório"),
  subject: z.string().optional(),
  body: z.string().min(5, "Corpo é obrigatório"),
  active: z.boolean().default(true),
});

export async function listMessageTemplates(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allTemplates = await firebaseClient.listDocs<any>("message_templates");
  const templates = allTemplates.filter((t: any) => t.company_id === orgId);
  templates.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));

  return { data: templates, error: null };
}

export async function createMessageTemplate(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = templateSchema.safeParse({
    ...raw,
    active: raw.active !== "false",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const templateId = `template_${Date.now()}`;
  const template = {
    id: templateId,
    company_id: orgId,
    name: parsed.data.name,
    kind: parsed.data.kind,
    subject: parsed.data.subject || null,
    body: parsed.data.body,
    variables: [],
    active: parsed.data.active,
    created_by: "admin-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("message_templates", templateId, template);
  if (!res.success) return { error: res.error };

  await auditLog({
    orgId,
    userId: "admin-user",
    action: "message_template.created",
    entity: "message_templates",
    entityId: templateId,
    metadata: { name: parsed.data.name, kind: parsed.data.kind },
  });

  revalidatePath("/comunicacao");
  return { data: template, error: null };
}
