import { describe, it, expect } from "vitest";
import { isWithinBusinessHours, DEFAULT_BUSINESS_HOURS } from "@/features/whatsapp/lib/business-hours";
import { buildLocationLinks } from "@/features/whatsapp/lib/location-links";
import {
  buildMetaInteractiveButtonsPayload,
  buildEvolutionButtonsPayload,
  formatInteractiveTextFallback,
  DEFAULT_APPOINTMENT_BUTTONS,
  DEFAULT_WAITLIST_BUTTONS,
} from "@/features/whatsapp/lib/interactive-buttons";
import { parsePixReceiptText } from "@/features/whatsapp/lib/pix-ocr";

describe("10 Sugestões WhatsApp - Testes de Unidade e Lógica de Negócio", () => {
  describe("Gatilhos com Botões Interativos (Quick Reply Buttons)", () => {
    it("deve gerar payload Meta Cloud API com botões interativos corretos", () => {
      const payload = buildMetaInteractiveButtonsPayload({
        to: "5511999999999",
        title: "Sec Jessica",
        body: "Olá! Confirma sua consulta?",
        buttons: DEFAULT_APPOINTMENT_BUTTONS,
      });

      expect(payload.messaging_product).toBe("whatsapp");
      expect(payload.type).toBe("interactive");
      expect(payload.interactive.type).toBe("button");
      expect(payload.interactive.action.buttons).toHaveLength(3);
      expect(payload.interactive.action.buttons[0].reply.id).toBe("btn_confirm");
      expect(payload.interactive.action.buttons[1].reply.title).toBe("🔄 Reagendar");
    });

    it("deve gerar payload para Evolution API com botões nativos", () => {
      const evoPayload = buildEvolutionButtonsPayload({
        to: "5511999999999",
        body: "Por favor selecione uma opção:",
        buttons: DEFAULT_WAITLIST_BUTTONS,
      });

      expect(evoPayload.number).toBe("5511999999999");
      expect(evoPayload.buttons).toHaveLength(2);
      expect(evoPayload.buttons[0].buttonText.displayText).toBe("✅ Quero o Encaixe");
    });

    it("deve fornecer fallback textual rico numerado para dispositivos sem suporte a botões", () => {
      const fallback = formatInteractiveTextFallback("Confirmar horário?", DEFAULT_APPOINTMENT_BUTTONS);
      expect(fallback).toContain("1️⃣ *✅ Confirmar*");
      expect(fallback).toContain("2️⃣ *🔄 Reagendar*");
      expect(fallback).toContain("👉 *Selecione uma opção respondendo com o número correspondente:*");
    });
  });

  describe("Localização em Tempo Real e Link do Waze / Uber / Maps", () => {
    it("deve gerar links válidos de Google Maps, Waze e Uber a partir de um endereço", () => {
      const address = "Av. Paulista, 1000 - Bela Vista, São Paulo - SP";
      const links = buildLocationLinks(address);

      expect(links.googleMapsUrl).toContain("google.com/maps/search/?api=1&query=");
      expect(links.googleMapsUrl).toContain("Paulista");
      expect(links.wazeUrl).toContain("waze.com/ul?q=");
      expect(links.uberUrl).toContain("m.uber.com/ul/?action=setPickup");
      expect(links.formattedWhatsAppText).toContain("📍 *Endereço da Clínica / Consultório:*");
      expect(links.formattedWhatsAppText).toContain("🗺️ *Google Maps:*");
      expect(links.formattedWhatsAppText).toContain("🚗 *Abrir no Waze:*");
    });
  });

  describe("Horário de Atendimento e Ausência Noturna", () => {
    it("deve identificar corretamente horário comercial e fora do expediente", () => {
      // 14/10/2026 é quarta-feira (dia de semana útil)
      // Definindo hora local explicitamente via ISO string com timezone de Brasília -03:00
      const insideDate = new Date("2026-10-14T14:00:00-03:00");
      const outsideNight = new Date("2026-10-14T22:30:00-03:00");
      const outsideSunday = new Date("2026-10-18T11:00:00-03:00");

      const checkInside = isWithinBusinessHours({}, insideDate);
      const checkNight = isWithinBusinessHours({}, outsideNight);
      const checkSunday = isWithinBusinessHours({}, outsideSunday);

      expect(checkInside.isWithin).toBe(true);
      expect(checkNight.isWithin).toBe(false);
      expect(checkNight.reason).toBe("outside_hours");
      expect(checkSunday.isWithin).toBe(false);
      expect(checkSunday.reason).toBe("weekend_or_non_workday");
    });

    it("deve conter a mensagem padrão de ausência com horário do próximo dia útil", () => {
      expect(DEFAULT_BUSINESS_HOURS.outOfHoursMessage).toContain("08:00");
      expect(DEFAULT_BUSINESS_HOURS.outOfHoursMessage).toContain("próximo dia útil");
    });
  });

  describe("Comprovante Pix e Extração OCR", () => {
    it("deve extrair valor em R$ e informações essenciais do texto do comprovante", () => {
      const sampleOcrText = `
        Comprovante de Transferência PIX
        Instituição: Banco Inter
        Data: 17/10/2026 às 15:30:12
        Valor: R$ 350,00
        Para: Dra. Jessica Consultório
        Chave Pix: 12.345.678/0001-90
        ID da transação: E12345678202610171530abcd
      `;

      const parsed = parsePixReceiptText(sampleOcrText);
      expect(parsed.isPixReceipt).toBe(true);
      expect(parsed.amount).toBe(350.00);
      expect(parsed.transactionId).toContain("E12345678202610171530abcd");
      expect(parsed.bankName).toBe("Inter");
      expect(parsed.confidenceScore).toBeGreaterThanOrEqual(50);
    });

    it("deve tratar textos que não são comprovantes com segurança", () => {
      const invalidText = "Olá, gostaria de saber o valor da consulta?";
      const parsed = parsePixReceiptText(invalidText);
      expect(parsed.isPixReceipt).toBe(false);
      expect(parsed.amount).toBeNull();
      expect(parsed.confidenceScore).toBeLessThan(50);
    });
  });
});
