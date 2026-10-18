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

  const fetchMemberships = useCallback(async (uid: string) => {
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (prof) {
      setProfile(prof);
      setRole((prof.role as UserRole) ?? "secretary");
    }

    const { data: members } = await supabase
      .from("company_members")
      .select("*, company:companies(*)")
      .eq("user_id", uid);

    if (members && members.length > 0) {
      const mapped = members.map((m: any) => m.company).filter(Boolean);
      setCompanies(mapped);
      if (!currentCompany) setCurrentCompany(mapped[0]);
    } else {
      setCompanies([]);
      setCurrentCompany(null);
    }
  }, [supabase, currentCompany]);

  useEffect(() => {
    // 1. Tenta inicializar Firebase local session
    const storedFb = firebaseClient.getStoredAuth();
    if (storedFb) {
      setUser({ id: storedFb.uid, email: storedFb.email, user_metadata: { full_name: storedFb.displayName } });
      setProfile({ id: storedFb.uid, full_name: storedFb.displayName || "Usuário", role: "admin" });
      setRole("admin");
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchMemberships(session.user.id);
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
        setUser(s?.user ?? null);
        if (s?.user) {
          void fetchMemberships(s.user.id);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchMemberships]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Tenta Supabase
    const { data: subData, error: subError } = await supabase.auth.signInWithPassword({ email, password });
    if (!subError && subData?.user) {
      return { error: null };
    }

    // Fallback gracioso para Firebase Auth
    const { user: fbUser, error: fbError } = await firebaseClient.signInWithEmail(email, password);
    if (fbUser) {
      setUser({ id: fbUser.uid, email: fbUser.email, user_metadata: { full_name: fbUser.displayName } });
      setProfile({ id: fbUser.uid, full_name: fbUser.displayName || "Usuário", role: "admin" });
      setRole("admin");
      return { error: null };
    }

    return { error: subError || new Error(fbError || "Falha na autenticação") };
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data: subData, error: subError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (!subError && subData?.user) {
      return { error: null };
    }

    // Fallback gracioso para Firebase Auth
    const { user: fbUser, error: fbError } = await firebaseClient.signUpWithEmail(email, password, fullName);
    if (fbUser) {
      setUser({ id: fbUser.uid, email: fbUser.email, user_metadata: { full_name: fullName } });
      setProfile({ id: fbUser.uid, full_name: fullName, role: "admin" });
      setRole("admin");
      return { error: null };
    }

    return { error: subError || new Error(fbError || "Falha no cadastro") };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await firebaseClient.signOut();
    setUser(null);
    setProfile(null);
    setCompanies([]);
    setCurrentCompany(null);
    setRole(null);
  }, [supabase]);

  const updateProfile = useCallback(async (data: any) => {
    if (!user?.id) return { error: new Error("Usuário não autenticado") };
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...data, updated_at: new Date().toISOString() });
    return { error };
  }, [supabase, user?.id]);

  const createCompany = useCallback(async (data: any) => {
    if (!user?.id) return { error: new Error("Usuário não autenticado"), data: null };
    const { data: company, error } = await supabase
      .from("companies")
      .insert({ ...data, owner_id: user.id })
      .select()
      .single();
    if (!error && company) {
      await supabase.from("company_members").insert({
        company_id: company.id,
        user_id: user.id,
        role: "admin",
      });
      setCompanies((prev) => [...prev, company]);
      setCurrentCompany(company);
    }
    return { error, data: company };
  }, [supabase, user?.id]);

  const value: AuthContextType = {
    session, user, profile, companies, currentCompany, role, loading,
    signIn, signUp, signOut, updateProfile, setCurrentCompany, createCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
