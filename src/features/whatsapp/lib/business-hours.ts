/**
 * Validação de Horário Comercial e Gerador de Mensagens de Ausência Noturna
 */

export interface BusinessHoursSettings {
  enabled: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "18:00"
  workDays: number[]; // [1, 2, 3, 4, 5] (1 = Seg, 7 = Dom)
  outOfHoursMessage: string;
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursSettings = {
  enabled: true,
  startTime: "08:00",
  endTime: "18:00",
  workDays: [1, 2, 3, 4, 5], // Seg a Sex
  outOfHoursMessage:
    "Olá! Agradecemos sua mensagem. Nosso horário de atendimento é de Segunda a Sexta, das 08:00 às 18:00. A secretária Jéssica responderá sua solicitação pontualmente às 08:00 do próximo dia útil. Em casos de urgência médica, procure a unidade de emergência mais próxima.",
};

export function isWithinBusinessHours(
  settings: Partial<BusinessHoursSettings> = {},
  now: Date = new Date()
): { isWithin: boolean; reason?: string } {
  const merged = { ...DEFAULT_BUSINESS_HOURS, ...settings };
  if (!merged.enabled) {
    return { isWithin: true };
  }

  // Obter hora e minuto em Brasília sem criar Date interpretado no fuso local do servidor
  const spTimeParts = now.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).split(/[: ]/);
  const spHour = Number(spTimeParts[spTimeParts.length - 2]);
  const spMinute = Number(spTimeParts[spTimeParts.length - 1]);
  const dayOfWeekSP = new Date(now.toLocaleDateString("en-US", { timeZone: "America/Sao_Paulo" })).getDay(); // 0 = Dom, 1 = Seg, 6 = Sab
  const adjustedDay = dayOfWeekSP === 0 ? 7 : dayOfWeekSP; // 1 = Seg, 7 = Dom

  if (!merged.workDays.includes(adjustedDay)) {
    return { isWithin: false, reason: "weekend_or_non_workday" };
  }

  const currentMinutes = spHour * 60 + spMinute;

  const [startH, startM] = (merged.startTime || "08:00").split(":").map(Number);
  const startMinutes = startH * 60 + (startM || 0);

  const [endH, endM] = (merged.endTime || "18:00").split(":").map(Number);
  const endMinutes = endH * 60 + (endM || 0);

  if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
    return { isWithin: false, reason: "outside_hours" };
  }

  return { isWithin: true };
}
