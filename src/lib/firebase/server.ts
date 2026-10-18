/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { firebaseConfig } from "@/lib/firebase/config";

/**
 * Cliente Firebase para uso no servidor (Server Actions, Server Components, Route Handlers).
 * Usa a REST API do Firebase Auth e Firestore com o token de ID do usuário.
 */

export interface FirebaseUser {
  uid: string;
  email: string;
  idToken: string;
}

/**
 * Verifica se o Firebase está configurado corretamente
 */
export async function isFirebaseConfigured(): Promise<boolean> {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("placeholder")
  );
}

/**
 * Verifica se o usuário tem token válido e retorna o ID Token
 * Em ambiente de servidor, recebemos o token por parâmetro (enviado pelo cliente)
 */
export async function getFirebaseUser(idToken: string): Promise<{ user: FirebaseUser | null; error: string | null }> {
  if (!isFirebaseConfigured()) {
    return { user: null, error: "Firebase não configurado" };
  }

  try {
    // Verifica o ID Token com o Firebase Auth
    const res = await fetch(
      `${firebaseConfig.authBaseUrl}:getAccountInfo?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      return { user: null, error: "Token inválido ou expirado" };
    }

    const data = await res.json();
    const users = data.users || [];
    if (!users || users.length === 0) {
      return { user: null, error: "Usuário não encontrado" };
    }

    const u = users[0];
    return {
      user: {
        uid: u.localId,
        email: u.email || "",
        idToken,
      },
      error: null,
    };
  } catch (e: any) {
    return { user: null, error: e.message || "Erro ao verificar usuário" };
  }
}

/**
 * Lista documentos de uma coleção no Firestore
 */
export async function firebaseListDocs<T = Record<string, any>>(
  collection: string,
  idToken?: string
): Promise<T[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const url = `${firebaseConfig.firestoreBaseUrl}/${collection}?key=${firebaseConfig.apiKey}&pageSize=100`;
    const res = await fetch(url, { headers });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map((doc: any) => {
      const nameParts = doc.name.split("/");
      const id = nameParts[nameParts.length - 1];
      return decodeFirestoreFields({ id, ...doc.fields }) as T;
    }) as T[];
  } catch {
    return [];
  }
}

/**
 * Obtém um documento específico do Firestore
 */
export async function firebaseGetDoc<T = Record<string, any>>(
  collection: string,
  docId: string,
  idToken?: string
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {};
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const url = `${firebaseConfig.firestoreBaseUrl}/${collection}/${docId}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, { headers });

    if (!res.ok) return null;

    const data = await res.json();
    return { id: docId, ...decodeFirestoreFields(data.fields) } as T;
  } catch {
    return null;
  }
}

/**
 * Cria ou atualiza um documento no Firestore
 */
export async function firebaseSetDoc(
  collection: string,
  docId: string,
  data: Record<string, any>,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const fields = encodeFirestoreFields({
      ...data,
      updated_at: new Date().toISOString(),
    });

    const url = `${firebaseConfig.firestoreBaseUrl}/${collection}/${docId}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || "Erro no Firestore" };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Remove um documento do Firestore
 */
export async function firebaseDeleteDoc(
  collection: string,
  docId: string,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {};
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const url = `${firebaseConfig.firestoreBaseUrl}/${collection}/${docId}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, { method: "DELETE", headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error?.message || "Erro ao excluir documento" };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Consulta documentos com filtro por campo
 */
export async function firebaseQueryDocs<T = Record<string, any>>(
  collection: string,
  filter?: { field: string; value: string },
  idToken?: string
): Promise<T[]> {
  try {
    const all = await firebaseListDocs<T>(collection, idToken);
    if (!filter) return all;
    return all.filter((item: any) => item[filter.field] === filter.value);
  } catch {
    return [];
  }
}

/**
 * Encodifica campos para o formato do Firestore REST
 */
function encodeFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === "boolean") {
      fields[key] = { booleanValue: val };
    } else if (typeof val === "number") {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === "string") {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((item) => {
            if (typeof item === "string") return { stringValue: item };
            if (typeof item === "number") return { doubleValue: item };
            if (typeof item === "boolean") return { booleanValue: item };
            return { stringValue: JSON.stringify(item) };
          }),
        },
      };
    } else if (typeof val === "object") {
      fields[key] = {
        mapValue: {
          fields: encodeFirestoreFields(val),
        },
      };
    }
  }
  return fields;
}

/**
 * Decodifica campos do formato do Firestore REST
 */
function decodeFirestoreFields(fields: Record<string, any>): Record<string, any> {
  if (!fields) return {};
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    if ("stringValue" in val) result[key] = val.stringValue;
    else if ("integerValue" in val) result[key] = parseInt(val.integerValue, 10);
    else if ("doubleValue" in val) result[key] = val.doubleValue;
    else if ("booleanValue" in val) result[key] = val.booleanValue;
    else if ("nullValue" in val) result[key] = null;
    else if ("timestampValue" in val) result[key] = val.timestampValue;
    else if ("arrayValue" in val) {
      result[key] = (val.arrayValue.values || []).map((v: any) => {
        if ("stringValue" in v) return v.stringValue;
        if ("integerValue" in v) return parseInt(v.integerValue, 10);
        if ("doubleValue" in v) return v.doubleValue;
        if ("booleanValue" in v) return v.booleanValue;
        return v;
      });
    } else if ("mapValue" in val) {
      result[key] = decodeFirestoreFields(val.mapValue.fields || {});
    }
  }
  return result;
}
