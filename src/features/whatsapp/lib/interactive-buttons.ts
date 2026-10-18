/**
 * Gerador e formatador de Botões Interativos (Quick Reply Buttons)
 * Compatível com Meta Cloud API, Evolution API e fallback para texto formatado
 */

export interface InteractiveButton {
  id: string;
  text: string;
}

export interface InteractivePayload {
  to: string;
  title?: string;
  body: string;
  footer?: string;
  buttons: InteractiveButton[];
}

/**
 * Constrói payload de botões para Evolution API
 */
export function buildEvolutionButtonsPayload(payload: InteractivePayload) {
  return {
    number: payload.to,
    title: payload.title || "Sec Jessica",
    description: payload.body,
    footerText: payload.footer || "Sec Jessica - Secretariado Remoto",
    buttons: payload.buttons.map((btn, idx) => ({
      buttonId: btn.id,
      buttonText: { displayText: btn.text },
      type: 1,
    })),
  };
}

/**
 * Constrói payload de botões para Meta Cloud API (WhatsApp Business API)
 */
export function buildMetaInteractiveButtonsPayload(payload: InteractivePayload) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: payload.to,
    type: "interactive",
    interactive: {
      type: "button",
      header: payload.title ? { type: "text", text: payload.title } : undefined,
      body: { text: payload.body },
      footer: { text: payload.footer || "Sec Jessica" },
      action: {
        buttons: payload.buttons.map((btn) => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.text.slice(0, 20), // Limite de 20 chars da Meta API
          },
        })),
      },
    },
  };
}

/**
 * Fallback textual rico para canais que não suportam botões nativos
 */
export function formatInteractiveTextFallback(body: string, buttons: InteractiveButton[], footer?: string): string {
  const optionsText = buttons.map((btn, idx) => `${idx + 1}️⃣ *${btn.text}*`).join("\n");
  const footerText = footer ? `\n\n_${footer}_` : "";
  return `${body}\n\n👉 *Selecione uma opção respondendo com o número correspondente:*\n${optionsText}${footerText}`;
}

/**
 * Botões padrão do Sec Jessica para agendamento
 */
export const DEFAULT_APPOINTMENT_BUTTONS: InteractiveButton[] = [
  { id: "btn_confirm", text: "✅ Confirmar" },
  { id: "btn_reschedule", text: "🔄 Reagendar" },
  { id: "btn_cancel", text: "❌ Cancelar" },
];

export const DEFAULT_WAITLIST_BUTTONS: InteractiveButton[] = [
  { id: "btn_accept_encaixe", text: "✅ Quero o Encaixe" },
  { id: "btn_decline_encaixe", text: "❌ Não Posso Neste Horário" },
];
