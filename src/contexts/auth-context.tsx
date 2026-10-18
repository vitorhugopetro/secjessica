"use client";

import React, { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { firebaseClient } from "@/lib/firebase/client";

export type UserRole = "admin" | "secretary";

interface AuthContextType {
  session: any;
  user: any;
  profile: any;
  companies: any[];
  currentCompany: any;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ error: any }>;
  setCurrentCompany: (company: any) => void;
  createCompany: (data: any) => Promise<{ error: any; data: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [currentCompany, setCurrentCompanyState] = useState<any>(null);

  // Restaura empresa selecionada do localStorage ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("secjessica:currentCompany");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && companies.some((c) => c.id === parsed.id)) {
          setCurrentCompanyState(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [companies]);

  const setCurrentCompany = useCallback((company: any) => {
    try {
      localStorage.setItem("secjessica:currentCompany", JSON.stringify(company));
    } catch {
      // ignore
    }
    setCurrentCompanyState(company);
  }, []);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseClient();

  const fetchCompanies = useCallback(async (uid: string, token?: string) => {
    // 1. Carrega do Firebase Firestore
    try {
      const fbDocs = await firebaseClient.listDocs<any>("companies", token);
      if (fbDocs && fbDocs.length > 0) {
        setCompanies(fbDocs);
        const saved = typeof window !== "undefined" ? localStorage.getItem("secjessica:currentCompany") : null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && fbDocs.some((c: any) => c.id === parsed.id)) {
              setCurrentCompanyState(parsed);
              return;
            }
          } catch {
            // ignore
          }
        }
        setCurrentCompany(fbDocs[0]);
        return;
      }
    } catch {
      // continua para fallback
    }

    // 2. Se Supabase configurado (não placeholder)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      try {
        const { data: members } = await supabase
          .from("company_members")
          .select("*, company:companies(*)")
          .eq("user_id", uid);

        if (members && members.length > 0) {
          const mapped = members.map((m: any) => m.company).filter(Boolean);
          setCompanies(mapped);
          if (!currentCompany) setCurrentCompany(mapped[0]);
          return;
        }
      } catch {
        // ignore
      }
    }

    // 3. Fallback: empresa padrão do usuário para garantir operação imediata
    const defaultComp = {
      id: "principal",
      name: "Consultório Principal",
      trade_name: "SecJessica Consultório",
      document: "00.000.000/0001-00",
      owner_id: uid,
      created_at: new Date().toISOString(),
    };
    setCompanies([defaultComp]);
    setCurrentCompany(defaultComp);
    void firebaseClient.setDoc("companies", "principal", defaultComp, token);
  }, [supabase, currentCompany, setCurrentCompany]);

  useEffect(() => {
    // 1. Tenta inicializar Firebase local session
    const storedFb = firebaseClient.getStoredAuth();
    if (storedFb) {
      setUser({ id: storedFb.uid, email: storedFb.email, user_metadata: { full_name: storedFb.displayName } });
      setProfile({ id: storedFb.uid, full_name: storedFb.displayName || "Usuário", role: "admin" });
      setRole("admin");
      void fetchCompanies(storedFb.uid, storedFb.idToken);
      setLoading(false);
    }

    // 2. Listener Supabase para sincronização secundária se configurado
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          await fetchCompanies(session.user.id);
        } else if (!storedFb) {
          setProfile(null);
          setCompanies([]);
          setCurrentCompany(null);
          setRole(null);
        }
        setLoading(false);
      });

      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (s) {
          setSession(s);
          if (s?.user) {
            setUser(s.user);
            void fetchCompanies(s.user.id);
          }
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else if (!storedFb) {
      setLoading(false);
    }
  }, [supabase, fetchCompanies]);

  const signIn = useCallback(async (email: string, password: string) => {
    // 1. Provedor primário: Firebase Auth
    const { user: fbUser, error: fbError } = await firebaseClient.signInWithEmail(email, password);
    if (fbUser) {
      setUser({ id: fbUser.uid, email: fbUser.email, user_metadata: { full_name: fbUser.displayName } });
      setProfile({ id: fbUser.uid, full_name: fbUser.displayName || "Usuário", role: "admin" });
      setRole("admin");
      await fetchCompanies(fbUser.uid, fbUser.idToken);
      return { error: null };
    }

    // 2. Fallback para Supabase se configurado
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      const { data: subData, error: subError } = await supabase.auth.signInWithPassword({ email, password });
      if (!subError && subData?.user) {
        return { error: null };
      }
      return { error: subError || new Error(fbError || "Falha na autenticação") };
    }

    return { error: new Error(fbError || "Falha na autenticação") };
  }, [supabase, fetchCompanies]);

  const signInWithGoogle = useCallback(async () => {
    // Provedor oficial: Firebase Auth nativo (Google OAuth Popup)
    const { user: fbUser, error: fbError } = await firebaseClient.signInWithGoogle();
    if (fbUser) {
      setUser({ id: fbUser.uid, email: fbUser.email, user_metadata: { full_name: fbUser.displayName } });
      setProfile({ id: fbUser.uid, full_name: fbUser.displayName || "Usuário", role: "admin" });
      setRole("admin");
      await fetchCompanies(fbUser.uid, fbUser.idToken);
      return { error: null };
    }

    return { error: new Error(fbError || "Falha ao autenticar com o Google") };
  }, [fetchCompanies]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    // 1. Provedor primário: Firebase Auth
    const { user: fbUser, error: fbError } = await firebaseClient.signUpWithEmail(email, password, fullName);
    if (fbUser) {
      setUser({ id: fbUser.uid, email: fbUser.email, user_metadata: { full_name: fullName } });
      setProfile({ id: fbUser.uid, full_name: fullName, role: "admin" });
      setRole("admin");
      await fetchCompanies(fbUser.uid, fbUser.idToken);
      return { error: null };
    }

    // 2. Fallback para Supabase se configurado
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      const { data: subData, error: subError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (!subError && subData?.user) {
        return { error: null };
      }
      return { error: subError || new Error(fbError || "Falha no cadastro") };
    }

    return { error: new Error(fbError || "Falha no cadastro") };
  }, [supabase, fetchCompanies]);

  const signOut = useCallback(async () => {
    await firebaseClient.signOut();
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    setCompanies([]);
    setCurrentCompany(null);
    setRole(null);
  }, [supabase]);

  const updateProfile = useCallback(async (data: any) => {
    if (!user?.id) return { error: new Error("Usuário não autenticado") };
    const storedFb = firebaseClient.getStoredAuth();
    if (storedFb && data.full_name) {
      await firebaseClient.updateProfile(storedFb.idToken, data.full_name);
    }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...data, updated_at: new Date().toISOString() });
    return { error: null };
  }, [supabase, user?.id]);

  const createCompany = useCallback(async (data: any) => {
    if (!user?.id) return { error: new Error("Usuário não autenticado"), data: null };
    const companyId = data.id || `comp_${Date.now()}`;
    const company = {
      id: companyId,
      name: data.name,
      trade_name: data.trade_name || data.name,
      document: data.document || "",
      phone: data.phone || "",
      email: data.email || user.email || "",
      address: data.address || "",
      owner_id: user.id,
      created_at: new Date().toISOString(),
    };

    const storedFb = firebaseClient.getStoredAuth();
    await firebaseClient.setDoc("companies", companyId, company, storedFb?.idToken);

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      try {
        await supabase.from("companies").insert({ ...data, owner_id: user.id });
      } catch {
        // ignore
      }
    }

    setCompanies((prev) => [...prev, company]);
    setCurrentCompany(company);
    return { error: null, data: company };
  }, [supabase, user?.id, setCurrentCompany]);

  const value: AuthContextType = {
    session, user, profile, companies, currentCompany, role, loading,
    signIn, signInWithGoogle, signUp, signOut, updateProfile, setCurrentCompany, createCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
