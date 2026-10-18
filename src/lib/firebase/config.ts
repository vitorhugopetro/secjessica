/**
 * Configurações oficiais do Firebase para Sec Jessica
 * Projeto: jessicasec (ID: 948645833442)
 * Hosting oficial: https://secjessica.web.app
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBDXHf3ElpDLR2UCruErpRobxUy1hBOY5w",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "jessicasec.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "jessicasec",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "jessicasec.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "948645833442",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:948645833442:web:bec7e39a17eefaadacccbb",
  firestoreBaseUrl: `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "jessicasec"}/databases/(default)/documents`,
  authBaseUrl: "https://identitytoolkit.googleapis.com/v1/accounts",
  secureTokenBaseUrl: "https://securetoken.googleapis.com/v1/token",
};
