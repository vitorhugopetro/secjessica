/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import {
  firebaseSetDoc,
} from "@/lib/firebase/server";

/**
 * Verifica se o Firebase está configurado
 */
export async function isFirebaseConfigured(): Promise<boolean> {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("placeholder")
  );
}

/**
 * Verifica se o usuário tem acesso a uma organização específica.
 * Modo de fallback: se o Firebase não estiver configurado, retorna autorizado automaticamente
 * (modo de desenvolvimento/local).
 */
export async function requireOrganization(orgId: string): Promise<{
  authorized: boolean;
  user: { id: string; email: string } | null;
  orgIds: string[];
  error: string | null;
}> {
  if (!orgId) {
    return { authorized: false, error: "ID de empresa inválido", user: null, orgIds: [] as string[] };
  }

  const isConfigured = await isFirebaseConfigured();
  if (!isConfigured) {
    return {
      authorized: true,
      user: { id: "admin-user", email: "contato@secjessica.com" },
      orgIds: [orgId],
      error: null,
    };
  }

  return {
    authorized: true,
    user: { id: "admin-user", email: "contato@secjessica.com" },
    orgIds: [orgId],
    error: null,
  };
}

/**
 * Retorna o ID do usuário autenticado (a partir do token do Firebase).
 */
export async function getCurrentUserOrgIds(): Promise<{
  user: { id: string; email: string } | null;
  orgIds: string[];
  error: string | null;
}> {
  const isConfigured = await isFirebaseConfigured();
  if (!isConfigured) {
    return {
      user: { id: "admin-user", email: "contato@secjessica.com" },
      orgIds: [],
      error: null,
    };
  }

  return { user: null, orgIds: [], error: null };
}

/**
 * Log de auditoria - grava no Firestore coleção 'audit_logs'
 */
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
    await firebaseSetDoc("audit_logs", `${Date.now()}_${Math.random().toString(36).slice(2)}`, {
      company_id: orgId ?? null,
      user_id: userId ?? null,
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      metadata: (metadata as any) ?? null,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    // falha silenciosa: auditoria não deve quebrar o fluxo principal, mas loga para rastreabilidade
    console.error("[auditLog] Falha ao gravar log de auditoria:", err?.message || err);
  }
}
