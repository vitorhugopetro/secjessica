"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("company_id", orgId)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      company_id: orgId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      subject: parsed.data.subject || null,
      body: parsed.data.body,
      variables: [],
      active: parsed.data.active,
      created_by: auth.user!.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "message_template.created",
    entity: "message_templates",
    entityId: data?.id,
    metadata: { name: parsed.data.name, kind: parsed.data.kind },
  });

  revalidatePath("/comunicacao");
  return { data, error: null };
}
