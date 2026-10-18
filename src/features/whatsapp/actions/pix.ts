"use server";

import { requireOrganization, auditLog } from "@/server/lib/organizations";
import { createServerClient } from "@/lib/supabase/server";
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
  const supabase = await createServerClient();

  const { data: record, error } = await supabase
    .from("pix_receipts")
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Notificação no sistema
  await supabase.from("notifications").insert({
    company_id: orgId,
    user_id: "system",
    title: "Comprovante Pix Recebido",
    body: `Comprovante de ${parsed.formattedAmount || "Pix"} recebido de ${data.senderPhone}. Aguarda conferência.`,
    kind: "pix_receipt",
    metadata: { receiptId: record?.id, parsed },
  });

  revalidatePath("/whatsapp");
  return { success: true, record, parsed };
}

/**
 * Lista comprovantes Pix da empresa
 */
export async function listPixReceipts(orgId: string): Promise<{ data: PixReceiptEntry[]; error?: string | null }> {
  const auth = await requireOrganization(orgId);
  if (!auth.authorized) return { data: [], error: auth.error };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pix_receipts")
    .select("*")
    .eq("company_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { data: [], error: error.message };
  return { data: (data as PixReceiptEntry[]) || [], error: null };
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

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pix_receipts")
    .update({
      status,
      verified_by: auth.user!.id,
    })
    .eq("id", receiptId)
    .eq("company_id", orgId)
    .select()
    .single();

  if (error) return { error: error.message };

  await auditLog({
    orgId,
    userId: auth.user!.id,
    action: `pix_receipt.${status}`,
    entity: "pix_receipts",
    entityId: receiptId,
  });

  revalidatePath("/whatsapp");
  return { success: true, data };
}
