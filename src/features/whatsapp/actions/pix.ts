"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { firebaseClient } from "@/lib/firebase/client";
import { revalidatePath } from "next/cache";
import { parsePixReceiptText } from "../lib/pix-ocr";

export interface PixReceiptEntry {
  id: string;
  company_id: string;
  appointment_id?: string | null;
  sender_phone: string;
  detected_amount?: number | null;
  detected_date?: string | null;
  transaction_id?: string | null;
  bank_name?: string | null;
  raw_ocr_text?: string | null;
  image_url?: string | null;
  status: "pending_verification" | "confirmed" | "rejected";
  created_at: string;
}

/**
 * Registra e processa comprovante Pix recebido via WhatsApp (texto ou OCR de imagem)
 */
export async function processPixReceipt(
  orgId: string,
  data: {
    senderPhone: string;
    rawText: string;
    imageUrl?: string;
    appointmentId?: string;
  }
) {
  const parsed = parsePixReceiptText(data.rawText);
  const receiptId = `pix_${Date.now()}`;
  const receipt = {
    id: receiptId,
    company_id: orgId,
    appointment_id: data.appointmentId || null,
    sender_phone: data.senderPhone,
    detected_amount: parsed.amount,
    detected_date: parsed.date ? new Date().toISOString() : null,
    transaction_id: parsed.transactionId,
    bank_name: parsed.bankName,
    raw_ocr_text: data.rawText,
    image_url: data.imageUrl || null,
    status: "pending_verification",
    created_at: new Date().toISOString(),
  };

  const res = await firebaseClient.setDoc("pix_receipts", receiptId, receipt);
  if (!res.success) return { error: res.error };

  // Notificação no sistema
  await firebaseClient.setDoc("notifications", `notification_${Date.now()}`, {
    company_id: orgId,
    user_id: "system",
    title: "Comprovante Pix Recebido",
    body: `Comprovante de ${parsed.formattedAmount || "Pix"} recebido de ${data.senderPhone}. Aguarda conferência.`,
    kind: "pix_receipt",
    metadata: { receiptId, parsed },
    created_at: new Date().toISOString(),
    read: false,
  });

  revalidatePath("/whatsapp");
  return { success: true, record: receipt, parsed };
}

/**
 * Lista comprovantes Pix da empresa
 */
export async function listPixReceipts(orgId: string): Promise<{ data: PixReceiptEntry[]; error?: string | null }> {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const allReceipts = await firebaseClient.listDocs<any>("pix_receipts");
  const receipts = allReceipts.filter((r: any) => r.company_id === orgId);
  receipts.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));

  return { data: receipts as PixReceiptEntry[], error: null };
}

/**
 * Secretária confirma ou rejeita o comprovante Pix
 */
export async function updatePixReceiptStatus(
  orgId: string,
  receiptId: string,
  status: "confirmed" | "rejected"
) {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { error: auth.error };

  const { error } = await firebaseClient.setDoc("pix_receipts", receiptId, {
    status,
    verified_by: "admin-user",
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: String(error) };

  await auditLog({
    orgId,
    userId: "admin-user",
    action: `pix_receipt.${status}`,
    entity: "pix_receipts",
    entityId: receiptId,
  });

  revalidatePath("/whatsapp");
  return { success: true, data: null };
}
