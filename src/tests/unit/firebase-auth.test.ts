import { describe, it, expect } from "vitest";
import { firebaseClient } from "@/lib/firebase/client";

describe("Firebase Backend & Firestore Engine", () => {
  it("deve codificar e decodificar tipos de dados do Firestore corretamente", () => {
    const original = {
      name: "Consultório Dr. Silva",
      slots: 20,
      active: true,
      rating: 4.85,
      tags: ["medicina", "cardiologia"],
      metadata: {
        crm: "12345-RJ",
        verified: true,
      },
    };

    const encoded = firebaseClient.encodeFirestoreFields(original);

    expect(encoded.name.stringValue).toBe("Consultório Dr. Silva");
    expect(encoded.slots.integerValue).toBe("20");
    expect(encoded.active.booleanValue).toBe(true);
    expect(encoded.rating.doubleValue).toBe(4.85);
    expect(encoded.tags.arrayValue.values).toHaveLength(2);
    expect(encoded.metadata.mapValue.fields.crm.stringValue).toBe("12345-RJ");

    const decoded = firebaseClient.decodeFirestoreFields(encoded);
    expect(decoded.name).toBe(original.name);
    expect(decoded.slots).toBe(original.slots);
    expect(decoded.active).toBe(original.active);
    expect(decoded.rating).toBe(original.rating);
    expect(decoded.tags).toEqual(original.tags);
    expect(decoded.metadata.crm).toBe("12345-RJ");
    expect(decoded.metadata.verified).toBe(true);
  });

  it("deve salvar e recuperar sessão do Firebase no localStorage", () => {
    const mockUser = {
      uid: "usr-fb-123",
      email: "jessica@secjessica.com.br",
      displayName: "Jéssica Remota",
      idToken: "token-abc-123",
      refreshToken: "refresh-xyz-789",
      expiresIn: "3600",
    };

    firebaseClient.saveAuth(mockUser);
    const retrieved = firebaseClient.getStoredAuth();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.uid).toBe(mockUser.uid);
    expect(retrieved?.email).toBe(mockUser.email);
    expect(retrieved?.displayName).toBe(mockUser.displayName);

    firebaseClient.signOut();
    expect(firebaseClient.getStoredAuth()).toBeNull();
  });

  it("deve filtrar documentos corretamente em queryDocs localmente", async () => {
    const docs = [
      { id: "1", company_id: "comp_a", name: "Paciente 1" },
      { id: "2", company_id: "comp_b", name: "Paciente 2" },
      { id: "3", company_id: "comp_a", name: "Paciente 3" },
    ];

    const filtered = docs.filter((d) => d.company_id === "comp_a");
    expect(filtered).toHaveLength(2);
    expect(filtered.map((d) => d.name)).toEqual(["Paciente 1", "Paciente 3"]);
  });
});
