"use server";

import { requireOrganization, auditLog, getServerSupabase } from "@/server/lib/organizations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const orgSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  slug: z.string().min(3, "Slug é obrigatório").regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().default("America/Sao_Paulo"),
  segment: z.string().optional(),
});

export async function createFirstOrganization(prevState: any, formData: FormData) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = orgSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const slug = parsed.data.slug;
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single();
  if (existing) return { error: "Slug já está em uso" };

  const { data: org, error: insertError } = await supabase
    .from("companies")
    .insert({
      name: parsed.data.name,
      slug,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      timezone: parsed.data.timezone,
      segment: parsed.data.segment ?? null,
      owner_id: user.id,
    })
    .select()
    .single();

  if (insertError) return { error: insertError.message };

  await supabase.from("company_members").insert({
    company_id: org.id,
    user_id: user.id,
    role: "admin",
  });

  await auditLog({
    orgId: org.id,
    userId: user.id,
    action: "organization.created",
    entity: "companies",
    entityId: org.id,
    metadata: { name: org.name, slug },
  });

  revalidatePath("/empresas");
  return { data: org, error: null };
}

export async function listOrganizations() {
  const { authorized, orgIds, error } = await getCurrentUserOrgIdsSafe();
  if (!authorized) return { error };

  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("companies")
    .select("*, company_members!inner(role)")
    .in("id", orgIds)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error: null };
}

export async function getOrganization(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", orgId)
    .single();
  return { data, error: error?.message ?? null };
}

export async function updateOrganization(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = orgSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await (await getServerSupabase())
    .from("companies")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      timezone: parsed.data.timezone,
      segment: parsed.data.segment ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "organization.updated",
    entity: "companies",
    entityId: orgId,
  });

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${orgId}`);
  return { error: error?.message ?? null };
}

export async function deleteOrganization(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const { error } = await (await getServerSupabase())
    .from("companies")
    .delete()
    .eq("id", orgId);

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "organization.deleted",
    entity: "companies",
    entityId: orgId,
  });

  revalidatePath("/empresas");
  return { error: error?.message ?? null };
}

async function getCurrentUserOrgIdsSafe() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false, orgIds: [] as string[], error: "Não autenticado" };
  const { data: members } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id);
  return { authorized: true, user, orgIds: (members ?? []).map((m) => m.company_id), error: null };
}
