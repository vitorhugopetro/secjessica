import { firebaseConfig } from "./config";

/**
 * Cliente REST ultraleve para Firebase Auth e Firestore.
 * Funciona nativamente no navegador, Node e Edge sem dependências externas.
 */

// Interface de usuário autenticado
export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Armazenamento local de sessão
const TOKEN_KEY = "secjessica:firebase_auth";

export const firebaseClient = {
  /**
   * Obtém os tokens salvos na sessão local
   */
  getStoredAuth(): FirebaseUser | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(TOKEN_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Salva a sessão localmente
   */
  saveAuth(auth: FirebaseUser | null) {
    if (typeof window === "undefined") return;
    try {
      if (auth) {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignora erro de storage
    }
  },

  /**
   * Login com E-mail e Senha
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: FirebaseUser | null; error: string | null }> {
    try {
      const res = await fetch(`${firebaseConfig.authBaseUrl}:signInWithPassword?key=${firebaseConfig.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { user: null, error: data.error?.message || "Erro ao realizar login" };
      }

      const user: FirebaseUser = {
        uid: data.localId,
        email: data.email,
        displayName: data.displayName,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };

      this.saveAuth(user);
      return { user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || "Erro de conexão com o Firebase" };
    }
  },

  /**
   * Cadastro de novo usuário
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<{ user: FirebaseUser | null; error: string | null }> {
    try {
      const res = await fetch(`${firebaseConfig.authBaseUrl}:signUp?key=${firebaseConfig.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { user: null, error: data.error?.message || "Erro ao cadastrar usuário" };
      }

      const user: FirebaseUser = {
        uid: data.localId,
        email: data.email,
        displayName: displayName || "",
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };

      if (displayName) {
        await this.updateProfile(user.idToken, displayName);
      }

      this.saveAuth(user);
      return { user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || "Erro de conexão ao cadastrar" };
    }
  },

  /**
   * Atualiza nome de exibição no Firebase Auth
   */
  async updateProfile(idToken: string, displayName: string): Promise<boolean> {
    try {
      const res = await fetch(`${firebaseConfig.authBaseUrl}:update?key=${firebaseConfig.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, displayName, returnSecureToken: true }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Encerra a sessão
   */
  async signOut() {
    this.saveAuth(null);
  },

  /**
   * Helpers de conversão para tipos do Firestore REST
   */
  encodeFirestoreFields(obj: Record<string, any>): Record<string, any> {
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
            fields: this.encodeFirestoreFields(val),
          },
        };
      }
    }
    return fields;
  },

  decodeFirestoreFields(fields: Record<string, any>): Record<string, any> {
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
        result[key] = this.decodeFirestoreFields(val.mapValue.fields || {});
      }
    }
    return result;
  },

  /**
   * Grava documento no Firestore
   */
  async setDoc(collection: string, docId: string, data: Record<string, any>, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const fields = this.encodeFirestoreFields({
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
  },

  /**
   * Obtém documento do Firestore
   */
  async getDoc<T = Record<string, any>>(collection: string, docId: string, token?: string): Promise<T | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = `${firebaseConfig.firestoreBaseUrl}/${collection}/${docId}?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return null;

      const data = await res.json();
      return { id: docId, ...this.decodeFirestoreFields(data.fields) } as T;
    } catch {
      return null;
    }
  },

  /**
   * Lista documentos de uma coleção
   */
  async listDocs<T = Record<string, any>>(collection: string, token?: string): Promise<T[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = `${firebaseConfig.firestoreBaseUrl}/${collection}?key=${firebaseConfig.apiKey}&pageSize=100`;
      const res = await fetch(url, { headers });
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.documents) return [];

      return data.documents.map((doc: any) => {
        const nameParts = doc.name.split("/");
        const id = nameParts[nameParts.length - 1];
        return { id, ...this.decodeFirestoreFields(doc.fields) };
      }) as T[];
    } catch {
      return [];
    }
  },

  /**
   * Remove documento do Firestore
   */
  async deleteDoc(collection: string, docId: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

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
  },

  /**
   * Consulta documentos de uma coleção com filtro opcional por campo
   */
  async queryDocs<T = Record<string, any>>(
    collection: string,
    filter?: { field: string; value: string },
    token?: string
  ): Promise<T[]> {
    try {
      const all = await this.listDocs<T>(collection, token);
      if (!filter) return all;
      return all.filter((item: any) => item[filter.field] === filter.value);
    } catch {
      return [];
    }
  },
};
