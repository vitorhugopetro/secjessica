import { describe, it, expect } from "vitest";

describe("Integração de Fluxos de Negócio WhatsApp e Multiempresa", () => {
  it("deve calcular o atraso de 2 horas para disparo da pesquisa NPS pós-atendimento", () => {
    const appointmentEndTime = new Date("2026-10-17T15:00:00Z");
    const expectedNpsDispatchTime = new Date("2026-10-17T17:00:00Z");

    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const computedDispatchTime = new Date(appointmentEndTime.getTime() + twoHoursInMs);

    expect(computedDispatchTime.toISOString()).toBe(expectedNpsDispatchTime.toISOString());
  });

  it("deve ordenar e selecionar o próximo paciente da lista de espera por prioridade e timestamp", () => {
    interface WaitlistCandidate {
      id: string;
      patientName: string;
      priority: number; // 1 = Alta, 2 = Média, 3 = Baixa
      createdAt: string;
    }

    const waitlist: WaitlistCandidate[] = [
      { id: "p3", patientName: "Carlos Silva", priority: 2, createdAt: "2026-10-17T10:00:00Z" },
      { id: "p1", patientName: "Ana Souza", priority: 1, createdAt: "2026-10-17T11:00:00Z" },
      { id: "p2", patientName: "Beatriz Lima", priority: 1, createdAt: "2026-10-17T09:00:00Z" },
    ];

    // Ordenação: Prioridade ascendente (1 antes de 2), depois createdAt ascendente (quem chegou antes)
    const sorted = [...waitlist].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Beatriz tem prioridade 1 e chegou às 09:00 (antes de Ana às 11:00)
    expect(sorted[0].id).toBe("p2");
    expect(sorted[0].patientName).toBe("Beatriz Lima");
    expect(sorted[1].id).toBe("p1");
    expect(sorted[2].id).toBe("p3");
  });

  it("deve validar formato e higienização das tags de segmentação", () => {
    const rawTags = ["#PrimeiraConsulta", " retorno ", "#convenio", "#particular!"];
    const sanitized = rawTags.map((t) =>
      t.trim().replace(/^#/, "").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()
    );

    expect(sanitized).toEqual(["primeiraconsulta", "retorno", "convenio", "particular"]);
  });
});
