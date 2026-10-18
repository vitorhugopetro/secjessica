"use server";

import { auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";

export async function listNotifications(targetUserId?: string) {
  const allNotifications = await firebaseClient.listDocs<any>("notifications");
  const uid = targetUserId || "admin-user";
  const notifications = allNotifications.filter((n: any) => n.user_id === uid);
  notifications.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));

  return { data: notifications, error: null };
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await firebaseClient.setDoc("notifications", notificationId, {
    read: true,
    read_at: new Date().toISOString(),
  });
  revalidatePath("/notificacoes");
  return { error: error ? String(error) : null };
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
  const notificationId = `notification_${Date.now()}`;
  const { error } = await firebaseClient.setDoc("notifications", notificationId, {
    company_id: orgId,
    user_id: userId,
    title,
    body: body || null,
    kind: kind || null,
    metadata: (metadata as any) || {},
    created_at: new Date().toISOString(),
    read: false,
  });

  await auditLog({
    orgId,
    userId,
    action: "notification.created",
    entity: "notifications",
    metadata,
  });

  return { error: error ? String(error) : null };
}
