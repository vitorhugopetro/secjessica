"use server";

import { createServerClient } from "@/lib/supabase/server";

export async function getServerSupabase() {
  return await createServerClient();
}

export async function getCurrentUserOrgIds() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, orgIds: [] as string[], error: null };

  const { data: members, error } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id);

  if (error) {
    return { user, orgIds: [] as string[], error: error.message };
  }

  const orgIds = (members ?? []).map((m) => m.company_id);
  return { user, orgIds, error: null };
}

export async function requireOrganization(orgId: string) {
  if (!orgId) {
    return { authorized: false, error: "ID de empresa inválido", user: null, orgIds: [] as string[] };
  }
  const isPlaceholder = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (isPlaceholder) {
    return {
      authorized: true,
      user: { id: "admin-user", email: "contato@secjessica.com" },
      orgIds: [orgId],
      error: null,
    };
  }
  const { user, orgIds, error } = await getCurrentUserOrgIds();
  if (error || !user) return { authorized: false, error: "Não autenticado", user: null, orgIds: [] as string[] };
  if (!orgIds.includes(orgId)) {
    return { authorized: false, error: "Acesso negado a esta empresa", user: null, orgIds };
  }
  return { authorized: true, user, orgIds, error: null };
}

export async function auditLog({
  orgId,
  userId,
  action,
  entity,
  entityId,
  metadata,
  ipAddress,
  userAgent,
}: {
  orgId?: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const supabase = await getServerSupabase();
    await supabase.from("audit_logs").insert({
      company_id: orgId ?? null,
      user_id: userId ?? null,
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      metadata: (metadata as any) ?? null,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });
  } catch {
    // falha silenciosa: auditoria não deve quebrar o fluxo principal
  }
}
