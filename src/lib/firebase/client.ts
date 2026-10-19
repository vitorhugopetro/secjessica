/* eslint-disable @typescript-eslint/no-explicit-any */

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
      if (!data) return null;
      const parsed = JSON.parse(data) as FirebaseUser & { savedAt?: number };
      // Verifica expiração: se o token expirou, invalida
      const now = Date.now();
      const savedAt = Number(parsed.savedAt || 0);
      const expiresInMs = Number(parsed.expiresIn || 0) * 1000;
      if (!savedAt || now - savedAt > expiresInMs) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return parsed;
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
        localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...auth, savedAt: Date.now() }));
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignora erro de storage
    }
  },

  /**
   * Inicializa o SDK Web oficial do Firebase Auth dinamicamente
   */
  async loadFirebaseSDK(): Promise<any> {
    if (typeof window === "undefined") return null;
    if ((window as any).firebase?.auth) {
      return (window as any).firebase;
    }

    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout | null = null;
      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
      };

      // Carrega firebase-app-compat
      const scriptApp = document.createElement("script");
      scriptApp.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js";
      scriptApp.onload = () => {
        // Carrega firebase-auth-compat
        const scriptAuth = document.createElement("script");
        scriptAuth.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js";
        scriptAuth.onload = () => {
          cleanup();
          const fb = (window as any).firebase;
          if (fb && !fb.apps?.length) {
            fb.initializeApp({
              apiKey: firebaseConfig.apiKey,
              authDomain: firebaseConfig.authDomain,
              projectId: firebaseConfig.projectId,
              storageBucket: firebaseConfig.storageBucket,
              messagingSenderId: firebaseConfig.messagingSenderId,
              appId: firebaseConfig.appId,
            });
          }
          resolve(fb);
        };
        scriptAuth.onerror = () => {
          cleanup();
          reject(new Error("Falha ao carregar Firebase Auth"));
        };
        document.head.appendChild(scriptAuth);
      };
      scriptApp.onerror = () => {
        cleanup();
        reject(new Error("Falha ao carregar Firebase App"));
      };
      document.head.appendChild(scriptApp);

      timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout ao carregar Firebase SDK"));
      }, 15000);
    });
  },

  /**
   * Login ou Cadastro com Conta Google nativa do Firebase Auth
   */
  async signInWithGoogle(): Promise<{ user: FirebaseUser | null; error: string | null }> {
    try {
      if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("placeholder")) {
        return { user: null, error: "Firebase não está configurado. Verifique as variáveis de ambiente." };
      }

      const fb = await this.loadFirebaseSDK();
      if (!fb || !fb.auth) {
        return { user: null, error: "Não foi possível carregar os serviços do Firebase" };
      }

      const auth = fb.auth();
      const provider = new fb.auth.GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        const result = await auth.signInWithPopup(provider);
        const u = result.user;
        if (!u) {
          return { user: null, error: "Nenhum usuário retornado pelo Google" };
        }
        const idToken = await u.getIdToken();

        const user: FirebaseUser = {
          uid: u.uid,
          email: u.email || "",
          displayName: u.displayName || u.email?.split("@")[0] || "Usuário Google",
          idToken,
          refreshToken: u.refreshToken || "",
          expiresIn: "3600",
        };

        this.saveAuth(user);
        return { user, error: null };
      } catch (popupErr: any) {
        // Se popup foi bloqueado, tenta redirect como fallback
        if (popupErr.code === "auth/popup-blocked" || popupErr.message?.includes("popup")) {
          try {
            await auth.signInWithRedirect(provider);
            return { user: null, error: "redirect_pending" };
          } catch (redirectErr: any) {
            return { user: null, error: redirectErr.message || "Falha ao abrir janela de login do Google" };
          }
        }
        if (popupErr.code === "auth/popup-closed-by-user" || popupErr.code === "auth/cancelled-popup-request") {
          return { user: null, error: "A janela de login com o Google foi fechada." };
        }
        if (popupErr.code === "auth/configuration-not-found" || popupErr.message?.includes("CONFIGURATION_NOT_FOUND")) {
          return {
            user: null,
            error: "O provedor Google precisa ser ativado no Firebase Console (Authentication > Sign-in method > Google).",
          };
        }
        return { user: null, error: popupErr.message || "Erro ao conectar com Google" };
      }
    } catch (err: any) {
      return { user: null, error: err.message || "Erro ao conectar com Google" };
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
              if (typeof item === "number") {
                if (Number.isInteger(item)) return { integerValue: item.toString() };
                return { doubleValue: item };
              }
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
      else if ("integerValue" in val) {
        const n = Number(val.integerValue);
        // Preserva números grandes (acima de MAX_SAFE_INTEGER) como string para evitar perda de precisão
        result[key] = Number.isSafeInteger(n) ? n : val.integerValue;
      }
      else if ("doubleValue" in val) result[key] = val.doubleValue;
      else if ("booleanValue" in val) result[key] = val.booleanValue;
      else if ("nullValue" in val) result[key] = null;
      else if ("timestampValue" in val) result[key] = val.timestampValue;
      else if ("arrayValue" in val) {
        result[key] = (val.arrayValue.values || []).map((v: any) => {
          if ("stringValue" in v) return v.stringValue;
          if ("integerValue" in v) {
            const n = Number(v.integerValue);
            return Number.isSafeInteger(n) ? n : v.integerValue;
          }
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
   * Lista documentos de uma coleção (com paginação automática até esgotar)
   */
  async listDocs<T = Record<string, any>>(collection: string, token?: string): Promise<T[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let allDocs: T[] = [];
      let nextPageToken: string | undefined = token;

      // Loop de paginação: segue nextPageToken até não haver mais páginas
      for (let page = 0; page < 10; page++) {
        const url = `${firebaseConfig.firestoreBaseUrl}/${collection}?key=${firebaseConfig.apiKey}&pageSize=500${nextPageToken ? `&pageToken=${encodeURIComponent(nextPageToken)}` : ""}`;
        const res = await fetch(url, { headers });
        if (!res.ok) break;

        const data = await res.json();
        if (!data.documents) break;

        const pageDocs = data.documents.map((doc: any) => {
          const nameParts = doc.name.split("/");
          const id = nameParts[nameParts.length - 1];
          return { id, ...this.decodeFirestoreFields(doc.fields) };
        }) as T[];
        allDocs = [...allDocs, ...pageDocs];

        nextPageToken = data.nextPageToken;
        if (!nextPageToken) break;
      }

      return allDocs;
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
