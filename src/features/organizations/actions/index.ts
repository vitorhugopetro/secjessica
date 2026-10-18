/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import {
  firebaseGetDoc,
  firebaseListDocs,
  firebaseSetDoc,
  firebaseDeleteDoc,
} from "@/lib/firebase/server";
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

export async function createOrganization(prevState: any, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = orgSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const slug = parsed.data.slug;
  const existing = await firebaseClient.queryDocs("companies", { field: "slug", value: slug });
  if (existing && existing.length > 0) {
    return { error: "Slug já está em uso" };
  }

  const auth = await requireOrganization("");
  if (!auth.authorized || !auth.user) return { error: "Não autenticado" };

  const companyId = `comp_${Date.now()}`;
  const company = {
    id: companyId,
    name: parsed.data.name,
    slug,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    address: parsed.data.address ?? null,
    timezone: parsed.data.timezone,
    segment: parsed.data.segment ?? null,
    owner_id: auth.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("companies", companyId, company);
  if (!res.success) return { error: res.error };

  await firebaseClient.setDoc("company_members", `${companyId}_${auth.user.id}`, {
    id: `${companyId}_${auth.user.id}`,
    company_id: companyId,
    user_id: auth.user.id,
    role: "admin",
    created_at: new Date().toISOString(),
  });

  await auditLog({
    orgId: companyId,
    userId: auth.user.id,
    action: "organization.created",
    entity: "companies",
    entityId: companyId,
    metadata: { name: company.name, slug },
  });

  revalidatePath("/empresas");
  return { data: company, error: null };
}

export async function createFirstOrganization(prevState: any, formData: FormData) {
  return createOrganization(prevState, formData);
}

export async function listOrganizations() {
  const { authorized, orgIds, error } = await getCurrentUserOrgIdsSafe();
  if (!authorized) return { error };

  const data = await firebaseListDocs("companies");
  const filtered = data.filter((d: any) => orgIds.includes(d.id));
  return { data: filtered, error: null };
}

export async function getOrganization(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const data = await firebaseGetDoc("companies", orgId);
  return { data, error: data ? null : "Empresa não encontrada" };
}

export async function updateOrganization(orgId: string, prevState: any, formData: FormData) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const raw = Object.fromEntries(formData.entries());
  const parsed = orgSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await firebaseSetDoc("companies", orgId, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    address: parsed.data.address ?? null,
    timezone: parsed.data.timezone,
    segment: parsed.data.segment ?? null,
    updated_at: new Date().toISOString(),
  });

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "organization.updated",
    entity: "companies",
    entityId: orgId,
  });

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${orgId}`);
  return { error: error ? String(error) : null };
}

export async function deleteOrganization(orgId: string) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const { error } = await firebaseDeleteDoc("companies", orgId);

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: "organization.deleted",
    entity: "companies",
    entityId: orgId,
  });

  revalidatePath("/empresas");
  return { error: error ? String(error) : null };
}

async function getCurrentUserOrgIdsSafe() {
  const { user, orgIds, error } = await requireOrganization("");
  if (!user) return { authorized: false, orgIds: [] as string[], error: "Não autenticado" };
  return { authorized: true, user, orgIds, error: null };
}
