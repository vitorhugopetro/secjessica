"use server";

import { createServerClient } from "@/lib/supabase/server";
import { auditLog } from "@/server/lib/organizations";
import { revalidatePath } from "next/cache";

export async function listNotifications(targetUserId?: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: "Não autenticado" };
  const uid = targetUserId || user.id;

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/notificacoes");
  return { error: error?.message ?? null };
}

export async function createSystemNotification({
  orgId,
  userId,
  title,
  body,
  kind,
  metadata,
}: {
  orgId: string;
  userId: string;
  title: string;
  body?: string;
  kind?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("notifications")
    .insert({
      company_id: orgId,
      user_id: userId,
      title,
      body: body || null,
      kind: kind || null,
      metadata: (metadata as any) || {},
    });

  await auditLog({
    orgId,
    userId,
    action: "notification.created",
    entity: "notifications",
    metadata,
  });

  return { error: error?.message ?? null };
}
