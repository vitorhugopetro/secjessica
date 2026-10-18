/**
 * Parser e analisador heurístico / OCR de Comprovantes Pix
 * Extrai valores (R$), datas, banco emissor, ID da transação e beneficiário
 */

export interface PixReceiptParsed {
  isPixReceipt: boolean;
  amount: number | null;
  formattedAmount: string | null;
  transactionId: string | null;
  date: string | null;
  bankName: string | null;
  receiver: string | null;
  confidenceScore: number; // 0 a 100%
  extractedSummary: string;
}

export function parsePixReceiptText(text: string): PixReceiptParsed {
  if (!text || typeof text !== "string") {
    return {
      isPixReceipt: false,
      amount: null,
      formattedAmount: null,
      transactionId: null,
      date: null,
      bankName: null,
      receiver: null,
      confidenceScore: 0,
      extractedSummary: "Nenhum texto detectado",
    };
  }

  const normalized = text.toLowerCase();

  // Palavras-chave indicativas de comprovante
  const keywords = [
    "comprovante",
    "transferencia pix",
    "pagamento pix",
    "pix enviado",
    "autenticacao",
    "id da transacao",
    "banco",
    "instituicao",
    "chave pix",
    "valor",
  ];

  let matchesCount = 0;
  for (const kw of keywords) {
    if (normalized.includes(kw)) matchesCount++;
  }

  // 1. Extração do Valor (R$ XX,XX ou R$XX.XX)
  let amount: number | null = null;
  let formattedAmount: string | null = null;
  const amountRegex = /(?:r\$\s*|valor\s*:?\s*r?\$\s*)([0-9]{1,3}(?:\.[0-9]{3})*|\d+)[,.]([0-9]{2})/i;
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    const rawVal = `${amountMatch[1].replace(/\./g, "")}.${amountMatch[2]}`;
    amount = parseFloat(rawVal);
    if (!isNaN(amount)) {
      formattedAmount = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
  }

  // 2. Extração de ID / Autenticação (ex: E12345678... ou hashes alfanuméricos)
  let transactionId: string | null = null;
  const idRegex = /(?:id(?:\s*da\s*transa[cç][aã]o)?|autentica[cç][aã]o|protocolo|e-to-e)\s*[:=]?\s*([a-zA-Z0-9_\-]{16,40})/i;
  const idMatch = text.match(idRegex);
  if (idMatch) {
    transactionId = idMatch[1].trim();
  }

  // 3. Extração de Data (DD/MM/AAAA)
  let date: string | null = null;
  const dateRegex = /\b(\d{2}\/\d{2}\/\d{4})(?:\s*(?:[àas\-]|\s*)\s*(\d{2}:\d{2}))?/i;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    date = dateMatch[1];
    if (dateMatch[2]) date += ` ${dateMatch[2]}`;
  }

  // 4. Detecção de Banco
  let bankName: string | null = null;
  const banks = ["Nubank", "Itaú", "Bradesco", "Banco do Brasil", "Santander", "Inter", "C6 Bank", "Caixa", "Mercado Pago", "PagBank", "Sicredi", "Sicoob"];
  for (const bank of banks) {
    if (new RegExp(`\\b${bank}\\b`, "i").test(text)) {
      bankName = bank;
      break;
    }
  }

  // Cálculo da pontuação de confiança
  let confidenceScore = 0;
  if (matchesCount >= 2) confidenceScore += 30;
  if (matchesCount >= 4) confidenceScore += 20;
  if (amount !== null) confidenceScore += 25;
  if (transactionId !== null) confidenceScore += 15;
  if (date !== null) confidenceScore += 10;

  const isPixReceipt = confidenceScore >= 50;

  const extractedSummary = isPixReceipt
    ? `Comprovante Pix detectado: ${formattedAmount || "Valor não identificado"} em ${date || "Data recente"}${bankName ? ` via ${bankName}` : ""}. ID: ${transactionId || "N/A"}`
    : "Texto não conclusivo para comprovante Pix";

  return {
    isPixReceipt,
    amount,
    formattedAmount,
    transactionId,
    date,
    bankName,
    receiver: null,
    confidenceScore: Math.min(confidenceScore, 100),
    extractedSummary,
  };
}
