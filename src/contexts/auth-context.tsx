/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { firebaseClient } from "@/lib/firebase/client";

export type UserRole = "admin" | "secretary";

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  idToken: string;
}

export interface Company {
  id: string;
  name: string;
  trade_name?: string;
  document?: string;
  owner_id?: string;
  created_at?: string;
  slug?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  role?: string;
}

export interface AuthSession {
  user?: { id?: string; email?: string; user_metadata?: { full_name?: string } } | null;
  [key: string]: unknown;
}

interface AuthContextType {
  session: AuthSession | null;
  user: FirebaseUser | null;
  profile: Profile | null;
  companies: Company[];
  currentCompany: Company | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; [key: string]: unknown }) => Promise<{ error: Error | null }>;
  setCurrentCompany: (company: Company | null) => void;
  createCompany: (data: { name: string; trade_name?: string; document?: string; phone?: string; email?: string; address?: string; id?: string }) => Promise<{ error: Error | null; data: Company | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const storedFb = firebaseClient.getStoredAuth();

  const [user, setUser] = useState<FirebaseUser | null>(() => {
    if (storedFb) {
      return {
        uid: storedFb.uid,
        email: storedFb.email,
        displayName: storedFb.displayName,
        idToken: storedFb.idToken,
        refreshToken: storedFb.refreshToken,
        expiresIn: storedFb.expiresIn,
      };
    }
    return null;
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (storedFb) {
      return { id: storedFb.uid, full_name: storedFb.displayName || "Usuário", role: "admin" };
    }
    return null;
  });

  const [role, setRole] = useState<UserRole | null>(() => (storedFb ? "admin" : null));

  const [companies, setCompanies] = useState<Company[]>([]);

  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(() => {
    try {
      const saved = localStorage.getItem("secjessica:currentCompany");
      if (saved) {
        const parsed = JSON.parse(saved) as Company;
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
  const [loading, setLoading] = useState(() => !storedFb && hasSupabase);

  const setCurrentCompany = useCallback((company: Company | null) => {
    try {
      if (company) {
        localStorage.setItem("secjessica:currentCompany", JSON.stringify(company));
      }
    } catch {
      // ignore
    }
    setCurrentCompanyState(company);
  }, []);

  const supabase = createSupabaseClient();

  const fetchCompanies = useCallback(async (uid: string, token?: string) => {
    try {
      const fbDocs = await firebaseClient.listDocs<Company>("companies", token);
      if (fbDocs && fbDocs.length > 0) {
        setCompanies(fbDocs);
        const saved = typeof window !== "undefined" ? localStorage.getItem("secjessica:currentCompany") : null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as Company;
            if (parsed && fbDocs.some((c: Company) => c.id === parsed.id)) {
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

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      try {
        const { data: members } = await supabase
          .from("company_members")
          .select("*, company:companies(*)")
          .eq("user_id", uid);

        if (members && members.length > 0) {
          const mapped = members.map((m: Record<string, unknown>) => m.company as Company | null).filter(Boolean) as Company[];
          setCompanies(mapped);
          if (!currentCompany) setCurrentCompany(mapped[0]);
          return;
        }
      } catch {
        // ignore
      }
    }

    const defaultComp: Company = {
      id: "principal",
      name: "Consultório Principal",
      trade_name: "SecJessica Consultório",
      document: "00.000.000/0001-00",
      owner_id: uid,
      created_at: new Date().toISOString(),
    };
    setCompanies([defaultComp]);
    setCurrentCompany(defaultComp);
    void firebaseClient.setDoc("companies", "principal", defaultComp as unknown as Record<string, unknown>, token);
  }, [supabase, currentCompany, setCurrentCompany]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      return;
    }

    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: any) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email, user_metadata: { full_name: session.user.user_metadata?.full_name } } as unknown as FirebaseUser);
        void fetchCompanies(session.user.id);
      } else if (!storedFb) {
        setProfile(null);
        setCompanies([]);
        setCurrentCompany(null);
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!isMounted) return;
      if (s) {
        setSession(s as unknown as AuthSession | null);
        if (s?.user) {
          setUser({ id: s.user.id, email: s.user.email, user_metadata: { full_name: s.user.user_metadata?.full_name } } as unknown as FirebaseUser);
          void fetchCompanies(s.user.id);
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchCompanies, storedFb]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: fbUser, error: fbError } = await firebaseClient.signInWithEmail(email, password);
    if (fbUser) {
      setUser(fbUser);
      setProfile({ id: fbUser.uid, full_name: fbUser.displayName || "Usuário", role: "admin" });
      setRole("admin");
      await fetchCompanies(fbUser.uid, fbUser.idToken);
      return { error: null };
    }

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
    const { user: fbUser, error: fbError } = await firebaseClient.signInWithGoogle();
    if (fbUser) {
      setUser(fbUser);
      setProfile({ id: fbUser.uid, full_name: fbUser.displayName || "Usuário", role: "admin" });
      setRole("admin");
      await fetchCompanies(fbUser.uid, fbUser.idToken);
      return { error: null };
    }

    return { error: new Error(fbError || "Falha ao autenticar com o Google") };
  }, [fetchCompanies]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { user: fbUser, error: fbError } = await firebaseClient.signUpWithEmail(email, password, fullName);
    if (fbUser) {
      setUser(fbUser);
      setProfile({ id: fbUser.uid, full_name: fullName, role: "admin" });
      setRole("admin");
      await fetchCompanies(fbUser.uid, fbUser.idToken);
      return { error: null };
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      const { data: subData, error: subError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (!subError && subData?.user) {
        return { error: null };
      }
      return { error: subError || new Error(fbError?.message || "Falha no cadastro") };
    }

    return { error: new Error(fbError?.message || "Falha no cadastro") };
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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const updateProfile = useCallback(async (data: { full_name?: string; [key: string]: unknown }) => {
    if (!user?.id) return { error: new Error("Usuário não autenticado") };
    const storedFbAuth = firebaseClient.getStoredAuth();
    if (storedFbAuth && data.full_name) {
      await firebaseClient.updateProfile(storedFbAuth.idToken, data.full_name);
    }

    try {
      await firebaseClient.setDoc("profiles", user.id, { id: user.id, ...data } as Record<string, unknown>, storedFbAuth?.idToken);
    } catch {
      // ignore
    }

    setProfile((prev: Profile | null) => (prev ? { ...prev, ...data } : { id: user.id, full_name: data.full_name || "Usuário", role: "admin", ...data }));

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      try {
        await supabase.from("profiles").upsert({ id: user.id, ...data, updated_at: new Date().toISOString() });
      } catch {
        // ignore
      }
    }
    return { error: null };
  }, [supabase, user?.id]);

  const createCompany = useCallback(async (data: { name: string; trade_name?: string; document?: string; phone?: string; email?: string; address?: string; id?: string }) => {
    if (!user?.id) return { error: new Error("Usuário não autenticado"), data: null };
    const companyId = data.id || `comp_${Date.now()}`;
    const company: Company = {
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

    const storedFbAuth = firebaseClient.getStoredAuth();
    await firebaseClient.setDoc("companies", companyId, company as Record<string, unknown>, storedFbAuth?.idToken);

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
