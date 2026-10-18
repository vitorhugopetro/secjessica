/**
 * Configurações do Firebase para Sec Jessica
 * Todas as variáveis devem ser fornecidas via variáveis de ambiente.
 * Nunca comite credenciais reais no código-fonte.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  firestoreBaseUrl: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ? `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`
    : "",
  authBaseUrl: "https://identitytoolkit.googleapis.com/v1/accounts",
  secureTokenBaseUrl: "https://securetoken.googleapis.com/v1/token",
};

/**
 * Verifica se todas as variáveis de ambiente obrigatórias estão preenchidas
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("placeholder")
  );
}
